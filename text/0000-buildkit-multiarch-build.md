# Meta
[meta]: #meta
- Name: BuildKit Multi-Architecture Builds
- Start Date: 2026-08-19
- Author(s): @jericop
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: N/A
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes adding BuildKit as an execution backend for `pack build` to enable multi-architecture container image builds. Instead of running lifecycle phases as individual Docker containers (pack's current approach which is limited to a single architecture), this feature generates a Dockerfile or LLB graph that runs all lifecycle phases inside BuildKit, enabling cross-platform builds via QEMU emulation and producing a manifest list (image index) as the final artifact.

# Definitions
[definitions]: #definitions

- **BuildKit**: A toolkit for converting source code to build artifacts, the build engine behind `docker buildx`.
- **LLB (Low-Level Builder)**: BuildKit's intermediate binary format that defines a build graph.
- **Manifest List / Image Index**: An OCI image index that references multiple platform-specific image manifests under a single tag.
- **QEMU Emulation**: User-mode CPU emulation allowing execution of binaries built for a different architecture.
- **BuildKit Cache Mount**: A persistent directory (`--mount=type=cache`) that survives across builds on the same BuildKit daemon.
- **`docker-container` driver**: A buildx builder driver that runs BuildKit in a separate Docker container, enabling multi-platform builds.

# Motivation
[motivation]: #motivation

## Why should we do this?

The Cloud Native Buildpacks ecosystem now has multi-architecture builders, buildpacks, and run images (RFC 0128). However, there is no way for application developers to produce a multi-architecture app image with a single `pack build` invocation. Users must currently:

1. Run `pack build` once per architecture (requiring native hardware or complex CI matrices)
2. Manually assemble the per-architecture images into a manifest list
3. Push the manifest list to a registry

This is error-prone, slow, and lacks the caching benefits that a unified build system provides.

BuildKit solves this by:
- Running builds for multiple platforms in parallel within a single invocation
- Using QEMU emulation for non-native architectures (transparent to buildpacks)
- Providing persistent cache mounts that survive across builds
- Supporting registry-based cache import/export for CI environments

## Related Issues

- [Multi arch image build support](https://github.com/buildpacks/pack/issues/1570)
- [Support multi-platform builds with buildkit](https://github.com/buildpacks/pack/issues/2001)
- [Cloud Native Buildpacks: Proof of concept making multiarch images with buildkit (LFX Mentorship 2024)](https://mentorship.lfx.linuxfoundation.org/project/2c5ced86-d23b-41f5-aec3-59730e29f092)

# What it is
[what-it-is]: #what-it-is

A new `--buildkit` flag on `pack build` that enables an alternative execution backend. When enabled, lifecycle phases are executed inside BuildKit rather than individual Docker containers.

## User Experience

```bash
# Enable experimental features
pack config experimental true

# Multi-architecture build with BuildKit (Dockerfile backend, default)
pack build registry.example.com/myapp:latest \
  --path ./app \
  --builder paketobuildpacks/ubuntu-noble-builder:latest \
  --platforms linux/amd64,linux/arm64 \
  --buildkit \
  --publish \
  --buildkit-builder pack-multiplatform

# Using the LLB backend (direct BuildKit SDK integration)
pack build registry.example.com/myapp:latest \
  --path ./app \
  --builder paketobuildpacks/ubuntu-noble-builder:latest \
  --platforms linux/amd64,linux/arm64 \
  --buildkit \
  --publish \
  --buildkit-builder pack-multiplatform \
  --build-backend buildkit-llb
```

## How It Works

### Dockerfile Backend (Default)

1. Pack fetches builder metadata and resolves the buildpack detection order
2. A Dockerfile is generated with lifecycle phases as individual `RUN` commands
3. `docker buildx build --platform linux/amd64,linux/arm64` executes the Dockerfile
4. BuildKit runs both platforms in parallel (using QEMU for the non-native platform)
5. The lifecycle exporter pushes per-architecture images to the registry
6. Pack assembles the manifest list from the per-architecture digests

### LLB Backend

1. Pack connects directly to the BuildKit daemon via gRPC
2. An LLB graph is constructed programmatically (equivalent to the Dockerfile)
3. The graph is solved for each platform in parallel via errgroup
4. The lifecycle exporter pushes per-architecture images
5. Pack assembles the manifest list

### Generated Dockerfile Structure

```dockerfile
# syntax=docker/dockerfile:1
FROM <builder-image>
USER root
RUN /bin/bash <<'ORDER_EOF'
cat > /cnb/order.toml << 'TOML'
[[order]]
  [[order.group]]
    id = "paketo-buildpacks/go"
    version = "4.19.24"
TOML
ORDER_EOF

ARG TARGETARCH
RUN mkdir -p /cache /output && chown -R 1001:1001 /cache /output
ENV CNB_PLATFORM_API=0.15
ENV CNB_REGISTRY_AUTH='{"index.docker.io":"Basic ..."}'
USER 1001:1001
COPY --chown=1001:1001 . /workspace
WORKDIR /workspace

RUN --mount=type=cache,id=<cache-id>-${TARGETARCH},target=/cache,uid=1001,gid=1001 \
    /cnb/lifecycle/analyzer -run-image <run-image> <image>-build-<id>-${TARGETARCH}

RUN /cnb/lifecycle/detector -app /workspace

RUN --mount=type=cache,id=<cache-id>-${TARGETARCH},target=/cache,uid=1001,gid=1001 \
    /cnb/lifecycle/restorer -cache-dir /cache

RUN /cnb/lifecycle/builder -app /workspace

RUN --mount=type=cache,id=<cache-id>-${TARGETARCH},target=/cache,uid=1001,gid=1001 \
    /cnb/lifecycle/exporter -app /workspace -cache-dir /cache <image>-build-<id>-${TARGETARCH}
```

### Registry Authentication

Pack resolves credentials from the Docker keychain (including credential helpers) and passes them via the `CNB_REGISTRY_AUTH` environment variable. This is the same mechanism used by pack's normal build flow and eliminates the need for docker config file mounts inside BuildKit.

### Caching

Two levels of caching are available:

1. **BuildKit layer cache**: Each `RUN` instruction is cached by BuildKit. Unchanged steps (e.g., pulling the builder, setting up directories) are skipped on subsequent builds.

2. **Lifecycle buildpack cache**: The `--mount=type=cache` provides a persistent directory that the lifecycle restorer/exporter use to cache buildpack layers (e.g., downloaded Go modules, compiled dependencies). This persists across builds even when source code changes.

3. **Registry cache** (`--buildkit-cache-from`/`--buildkit-cache-to`): For CI environments where the BuildKit daemon is ephemeral, the build cache can be exported to and imported from a registry.

# How it Works
[how-it-works]: #how-it-works

## Platform Spec Compliance

The implementation complies with the Platform Interface Specification:

- Lifecycle phases are executed in the correct order (analyze → detect → restore → build → export)
- The detector and builder run as the CNB user (buildpack code cannot access registry credentials)
- The analyzer and exporter have access to registry auth via `CNB_REGISTRY_AUTH`
- The lifecycle cache is properly scoped per-architecture via `${TARGETARCH}` in the cache mount ID
- The spec's SHOULD recommendation for phase isolation is honored: buildpack code phases (detector, builder) do not have access to credentials

## Lifecycle Changes Required

Two lifecycle changes are needed for full functionality:

### 1. `-skip-chown` flag (required for LLB backend)

BuildKit runs in an unprivileged environment where `chown` is not permitted. The lifecycle's `EnsureOwner` function attempts to chown cache directories, which fails. The `-skip-chown` flag tells the lifecycle to skip this operation.

This is needed because the BuildKit LLB API does not expose uid/gid settings for cache mounts (unlike the Dockerfile frontend which handles this internally).

### 2. `-pull-run-image` flag (required for OCI layout export mode)

In OCI layout mode, the lifecycle expects the run image to already exist in the layout directory. The `-pull-run-image` flag tells the analyzer to pull it from the registry automatically.

## Intermediate Tags

The current implementation creates intermediate per-architecture tags during the build:

```
registry.example.com/myapp:latest-build-<8char-hex>-amd64
registry.example.com/myapp:latest-build-<8char-hex>-arm64
```

After the manifest list is assembled at the final tag, these intermediate tags remain on the registry. This is because the lifecycle exporter pushes directly to the registry during the build, and each platform's build runs in parallel — they cannot share the same tag.

# Drawbacks
[drawbacks]: #drawbacks

## Intermediate Tags on Registry

The most significant drawback is the creation of intermediate per-architecture tags. While they don't consume additional storage (the manifest list references the same blobs), they create visual clutter and may confuse users inspecting the registry.

**Mitigations:**
- Tags use a random build ID (`-build-<hex>-<arch>`) to avoid conflicts
- Registry garbage collection policies can clean them up
- The OCI layout export mode (future work) eliminates them entirely

## OCI Layout Export (Not Yet Functional)

An alternative approach that eliminates intermediate tags is OCI layout export:
- The lifecycle writes app images to local disk in OCI layout format
- Pack reads the per-architecture layouts and pushes the manifest list atomically
- No intermediate tags are created on the registry

**Current blockers:**
- The lifecycle's layout mode requires the run image to be pre-populated in the layout directory
- The `-pull-run-image` lifecycle flag (proposed above) resolves this
- Requires more local disk space during the build (temporary OCI layouts)

## Ephemeral Registry Export (Alternative)

Another approach to eliminate intermediate tags:
- Start a temporary registry on a Docker network shared with the BuildKit builder
- Lifecycle exports to the ephemeral registry
- Pack pulls from the ephemeral registry, assembles manifest list, pushes to final registry
- Ephemeral registry is destroyed after the build

**Tradeoffs:**
- Requires creating a purpose-built BuildKit builder with the correct network configuration
- Cannot reuse existing builders without the matching network
- Additional complexity in setup/teardown

## QEMU Emulation Performance

Cross-architecture builds via QEMU are significantly slower than native builds. A Go application that compiles in 5 seconds natively may take 30+ seconds under emulation. This is inherent to the emulation approach and not specific to this implementation.

## Requires `docker-container` BuildKit Driver

Multi-platform builds require the `docker-container` buildx driver (not the default `docker` driver). Users must create a builder:

```bash
docker buildx create --name pack-multiplatform --driver docker-container --bootstrap
```

## Requires `--publish`

Multi-architecture manifest lists cannot be loaded into a local Docker daemon. The `--publish` flag is required for multi-platform builds.

# Alternatives
[alternatives]: #alternatives

## Status Quo (Manual Per-Architecture Builds)

Users run `pack build` once per target architecture on matching hardware, then manually create the manifest list. This works but is tedious, error-prone, and doesn't benefit from BuildKit's caching.

## Docker Buildx with Custom Dockerfile

Users can write their own Dockerfile that invokes lifecycle phases and build with `docker buildx build --platform ...` directly. The generated Dockerfile from this RFC is essentially automating this approach.

## Native Multi-Node Builds

Instead of QEMU emulation, use multiple build machines (one per architecture) and combine results. This is faster but requires infrastructure investment. BuildKit supports this via `--append` on builder creation. This could be a future enhancement.

# Prior Art
[prior-art]: #prior-art

- [CNB LFX Buildkit POC (2024)](https://github.com/jericop/cnb-lfx-buildkit-poc): Initial proof-of-concept demonstrating lifecycle execution within BuildKit via a generated Dockerfile.
- [RFC 0128: Multi-platform support for builders and buildpack packages](https://github.com/buildpacks/rfcs/blob/main/text/0128-multiarch-builders-and-package.md): Establishes multi-architecture builders and buildpack packages, which this RFC builds upon for app image creation.
- [Docker Buildx](https://docs.docker.com/build/): The `docker buildx` tool that this RFC leverages for multi-platform builds.

# Implementation
[implementation]: #implementation

## Proof of Concept

A working POC exists across multiple repositories:

- **jericop/pack** (branch: `buildkit-multi-arc-poc`): Pack with BuildKit backends
- **jericop/cnb-lifecycle** (branches: `skip-chown`, `buildkit-multi-arch-support`): Patched lifecycle
- **jericop/ubuntu-noble-builder** (branch: `skip-chown-lifecycle`): Builder with patched lifecycle
- **jericop/pr-compliance-app** (branch: `pack-buildkit-poc`): CI testing with both backends

## Phases

### Phase 1: Dockerfile Backend (Experimental)
- New `--buildkit` flag (requires `pack config experimental true`)
- Dockerfile generation from lifecycle phase commands
- Single `docker buildx build` invocation for parallel multi-platform builds
- BuildKit cache mounts for lifecycle caching
- Registry cache import/export support
- `CNB_REGISTRY_AUTH` for authentication

### Phase 2: LLB Backend
- Direct BuildKit SDK integration via `github.com/moby/buildkit/client`
- Parallel per-platform solves via errgroup
- Programmatic LLB graph construction
- Streaming progress output with platform prefixes
- Requires lifecycle `-skip-chown` flag

### Phase 3: OCI Layout Export
- Lifecycle `-pull-run-image` flag to self-serve run image
- Export to local OCI layout (no intermediate tags)
- Manifest list assembly via `go-containerregistry`
- Atomic push of the complete manifest list

### Phase 4: Ephemeral Registry
- Automatic ephemeral registry lifecycle management
- Shared Docker network between builder and registry
- Builder capability detection

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

1. Should the intermediate tag format be configurable, or is `<image>-build-<hex>-<arch>` sufficient?
2. Should pack automatically create a `docker-container` builder if one doesn't exist?
3. How should the feature interact with `--trust-builder` in the buildkit context? Currently `--trust-builder` is passed but not strictly required since phase isolation is achieved through the Dockerfile/LLB structure.
4. Should the OCI layout mode or ephemeral registry mode be the default when both are available?
5. What is the migration path for the lifecycle `-skip-chown` and `-pull-run-image` flags into the upstream lifecycle? Should they be gated by Platform API version?

# Spec Changes
[spec-changes]: #spec-changes

This RFC does not require changes to the Platform Interface Specification. The lifecycle phases are invoked with the same arguments and semantics as defined in the spec. The BuildKit execution model is an implementation detail of the platform (pack).

However, the following lifecycle implementation changes are proposed:

- **`-skip-chown` flag**: Opt-in flag on analyzer, restorer, and exporter to skip `EnsureOwner` chown operations. Required for unprivileged execution environments.
- **`-pull-run-image` flag**: Opt-in flag on the analyzer to pull the run image from a registry into the layout directory when in layout mode.

These flags are additive and do not change default behavior.
