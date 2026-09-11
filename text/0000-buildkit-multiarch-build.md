# Meta
[meta]: #meta
- Name: BuildKit-Native Multi-Architecture Builds (emit/finalize)
- Start Date: 2026-08-19
- Author(s): @jericop
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: N/A
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes a **builder-agnostic, build-then-finalize** execution model that
lets an image-build engine (initially BuildKit) run the Cloud Native Buildpacks
lifecycle and assemble the final application image **natively**, producing a
multi-architecture manifest list from a single `pack build` invocation.

The core of the proposal is a small, additive **lifecycle contract** made of two
opt-in capabilities:

1. **emit** — the exporter computes the ordered *layer plan* and the image config
   (labels, env, entrypoint, run-image boundary) **without assembling or pushing an
   image**, surfacing it as a single config label
   (`io.buildpacks.lifecycle.prepared-metadata`) plus per-layer filesystem *source
   references*.
2. **finalize** — a lifecycle library (and subcommand) that, given a built+pushed
   image, reads its **actual produced layer diffIDs** plus the prepared-metadata
   label and **authors** the correct `io.buildpacks.lifecycle.metadata` (per-layer
   SHAs = produced diffIDs, run-image boundary), re-pushing **only the config +
   manifest (+ index)** — never the layers.

The build engine owns image assembly and layer digest computation; the lifecycle
owns CNB-metadata authorship. Earlier BuildKit-frontend work (see Prior Art) showed
that a build engine can assemble a CNB image and taught us this division of
responsibilities; emit/finalize builds on that to produce a correct, deterministic,
cache-maximizing multi-arch CNB image without exporting the layers and final image
for pack to re-process afterward.

# Definitions
[definitions]: #definitions

- **BuildKit**: A build engine (the engine behind `docker buildx`) that solves an
  LLB graph and can natively produce and push OCI images and manifest lists.
- **LLB (Low-Level Builder)**: BuildKit's intermediate build-graph format.
- **Manifest List / Image Index**: An OCI image index referencing multiple
  platform-specific manifests under a single tag.
- **diffID**: The digest of a layer's *uncompressed* tar; the identity CNB metadata
  records per layer. Whoever assembles a layer computes its diffID.
- **emit**: Lifecycle opt-in mode that records the ordered layer plan + image config
  instead of assembling/pushing an image.
- **finalize**: Lifecycle library/subcommand that authors `io.buildpacks.lifecycle.metadata`
  on an already-built image from its produced diffIDs.
- **prepared-metadata label**: `io.buildpacks.lifecycle.prepared-metadata` — the
  build-phase artifact carrying the emit plan + emitted CNB labels. Distinct from the
  final `io.buildpacks.lifecycle.metadata`.
- **build backend**: The pluggable engine that runs the lifecycle and assembles the
  image, selected by `--build-backend` (today: `buildkit`; the abstraction is kept for
  a future `buildah` backend).
- **buildah**: The build engine referenced throughout as a future second backend. The
  actual build library is [buildah](https://github.com/containers/buildah) (a
  daemonless OCI image builder); "podman" is its sibling tool in the same
  containers/* ecosystem and is sometimes named alongside it for context, but the
  backend itself would use the buildah Go library. This RFC uses **buildah** for the
  backend name to avoid ambiguity.

# Motivation
[motivation]: #motivation

## Why should we do this?

The CNB ecosystem has multi-architecture builders, buildpacks, and run images
(RFC 0128), but there is still no way to produce a multi-architecture **app** image
from a single `pack build`. Today users must:

1. Run `pack build` once per architecture (native hardware or CI matrices),
2. Manually assemble the per-arch images into a manifest list, and
3. Push the manifest list.

This is slow, error-prone, and forfeits the caching a unified build engine provides.

A build engine like BuildKit can build all target platforms in one invocation
(native nodes or QEMU), assemble the manifest list natively, and cache aggressively
(including remote/registry cache for ephemeral CI). The open problem has never been
"can the lifecycle run inside BuildKit" — prior art already showed it can. The open
problem is producing a **faithful CNB image** (correct `io.buildpacks.lifecycle.metadata`,
layer reuse, SBOM, rebase/rebuild support) when the **build engine**, not the
lifecycle exporter, assembles the image and therefore computes the layer diffIDs.

**The emit/finalize contract is the answer to that problem**, and it is the focus of
this RFC.

Single-`pack build` multi-arch also unblocks the tools that wrap pack. For example,
the Spring Boot Maven/Gradle plugins build an image by invoking the buildpacks
lifecycle (`mvn spring-boot:build-image`), but today that produces a **single-arch**
image because the underlying build is single-arch. A builder-agnostic multi-arch
`pack build` gives those plugins a path to emit a multi-architecture manifest list
directly from `mvn`/`gradle` — no per-arch matrix or manual manifest assembly in the
build tool — which is a common ask for teams shipping both amd64 and arm64 from a
single CI job.

## Related Issues

- [Multi arch image build support](https://github.com/buildpacks/pack/issues/1570)
- [Support multi-platform builds with buildkit](https://github.com/buildpacks/pack/issues/2001)
- [Cloud Native Buildpacks: Proof of concept making multiarch images with buildkit (LFX Mentorship 2024)](https://mentorship.lfx.linuxfoundation.org/project/2c5ced86-d23b-41f5-aec3-59730e29f092)

# What it is
[what-it-is]: #what-it-is

A `--build-backend` option on `pack build` (behind `pack config experimental true`)
selects the native build engine and, by being set, opts into the native
(build-then-finalize) path. It takes a single builder-agnostic value today:
`--build-backend buildkit` (or `auto`, which resolves to it). There is no separate
`--buildkit` toggle — the presence of `--build-backend` is the opt-in, and its value
is the engine selector, so a future `--build-backend buildah` needs no new top-level
flag. When set, the lifecycle phases run inside the engine, the engine assembles and
pushes the app image (one multi-arch OCI index; no intermediate per-arch tags), and
pack then calls the lifecycle **finalize** library to author the CNB metadata on the
pushed image.

## User Experience

```bash
# Enable experimental features
pack config experimental true

# Multi-architecture build with the buildkit backend
pack build registry.example.com/myapp:latest \
  --path ./app \
  --builder jericop/ubuntu-noble-builder:buildkit-native-export \
  --run-image paketobuildpacks/ubuntu-noble-run:latest \
  --platforms linux/amd64,linux/arm64 \
  --build-backend buildkit \
  --buildkit-builder pack-multiplatform \
  --publish --trust-builder

# Optional: remote/registry BuildKit cache (ephemeral CI)
  --buildkit-cache-from type=registry,ref=registry.example.com/myapp:cache \
  --buildkit-cache-to   type=registry,ref=registry.example.com/myapp:cache,mode=max
```

The result at `registry.example.com/myapp:latest` is a manifest list referencing one
image per requested platform, each a valid, runnable CNB app image.

## How It Works (build-then-finalize)

1. **Run the lifecycle in BuildKit.** Pack drives an in-process BuildKit gateway
   BuildFunc. The builder image is the base; the buildpack order is injected; source
   is copied in; the lifecycle runs analyze → detect → restore → build. Each phase is
   a BuildKit operation, so BuildKit caches it.
2. **Emit instead of export.** The exporter runs in **emit-mode**: it computes the
   exact ordered layer plan (new vs reused, identity, history, intended diffID,
   run-image boundary) and the image config (labels/env/entrypoint), and records per
   new layer a **filesystem source reference** (the directory the layer is built
   from) rather than building/persisting a tar. The plan + config are surfaced as the
   single label `io.buildpacks.lifecycle.prepared-metadata`.
3. **Assemble `FROM run-image` natively.** Pack's BuildFunc assembles the image as
   `FROM <run-image>` + `llb.Copy` of each emitted layer source (buildpack layers
   from `/layers/<bp>/<layer>`, app from `/workspace`, the launcher file; app slices
   honored via `IncludePatterns`; process-types via a tiny synthesized tree). The
   run image is read digest-pinned from the analyzer's `/layers/analyzed.toml` and is
   never modified.
4. **BuildKit builds + pushes.** BuildKit snapshots the layer filesystems, computes
   the layer diffIDs, and pushes one image per platform assembled into a single OCI
   index — no intermediate tags, and **no layer data ever egresses to the host**.
5. **Finalize authors the CNB metadata.** Pack calls the lifecycle `phase/finalize`
   library (the way `pkg/client/rebase.go` calls `phase.Rebaser`). Finalize reads the
   pushed image's produced diffIDs + the prepared-metadata label, maps plan entries
   to produced diffIDs positionally, authors `io.buildpacks.lifecycle.metadata`
   (every per-layer `sha` = produced diffID; `runImage.reference`/`topLayer` from the
   plan), removes the prepared-metadata label, and re-pushes **config + manifest (+
   index) only**. For a manifest list it finalizes each child then re-pushes the
   index. It is tag-atomic and idempotent.

### Registry Authentication

Pack resolves credentials from the Docker keychain (including credential helpers)
and passes them via `CNB_REGISTRY_AUTH` — the same mechanism used by pack's normal
build flow — so no docker-config mounts are needed inside BuildKit. A Docker auth
provider is also attached for BuildKit's own pulls/pushes and registry cache.

# How it Works
[how-it-works]: #how-it-works

## Why emit/finalize is necessary: whoever assembles the layers owns the diffIDs

There is one unavoidable fact about any modern build engine that assembles image
layers (verified against moby/buildkit v0.32.2): **the engine derives the final
image's layer diffIDs from the actual layer chain it produced.** A BuildKit gateway
frontend can return a solved LLB state, but it **cannot** hand the engine pre-built
layer blobs/diffIDs — the gateway result exposes only state operations, and BuildKit
recomputes diffIDs at export time.

Consequence: when the engine assembles a layer (via `COPY`/`llb.Copy` etc.), the
recreated tar is not byte-identical to the lifecycle's tar (header ordering,
timestamps, whiteouts, xattrs differ), so the produced diffID differs from the one
the lifecycle would compute. There are only two ways to end up with an image whose
CNB metadata matches its real layers:

1. **Make the layers be the lifecycle's exact layers** — materialize a full OCI
   layout on disk in-build and import it (preserves diffIDs). This forces the
   lifecycle to write every layer to disk and pull the run image into the layout, and
   round-trips large layer data through disk — the copy-IO cost we want to avoid.
2. **Make the metadata match what the engine produced** — let the engine assemble
   natively (no disk round-trip) and author the CNB metadata from the produced
   diffIDs afterward.

This RFC chooses (2), and refines it: rather than write metadata with the *intended*
diffIDs and then *patch* the SHAs post-push (an earlier spike did this), **finalize
authors the metadata from the produced diffIDs the first time**, in the lifecycle.
The build phase never writes a valid-but-wrong `io.buildpacks.lifecycle.metadata`;
it writes only the prepared-metadata label, and finalize turns that into the real
label.

## Why this avoids unnecessary copy IO and maximizes the BuildKit cache

Because assembly happens **inside** BuildKit from filesystem **source references**
(not persisted tars), the large app/dependency/run-image layers never leave
BuildKit's content store:

- **No layer egress to the host.** Only small JSON-ish metadata (the plan + config,
  carried as a label) crosses the BuildKit→host boundary; finalize pulls only the
  config + manifest to author metadata — never layer blobs.
- **No in-build disk materialization** of large layers (the copying cost of the
  OCI-layout alternative below is avoided entirely).
- **Every phase and every layer participates in BuildKit's content-addressable
  cache.** Unchanged phases (builder pull, order injection, analyze/detect/restore)
  are `CACHED`; unchanged assembly `COPY`s are `CACHED`; only changed layers are
  re-pushed.
- **Remote/registry cache is supported** (`--buildkit-cache-from`/`--buildkit-cache-to
  type=registry`), so ephemeral CI runners import a warm cache instead of rebuilding
  from cold. Verified: a freshly pruned builder imports the exported cache.

The net effect is that build time is dominated by real work (compilation) rather than
by copying image data around, and rebuilds are fast because the cache is maximized end
to end.

## Caching

Three independent cache layers are in play. They are easy to conflate, so it is worth
naming them separately:

1. **BuildKit vertex cache (skips whole phases).** Each lifecycle phase runs as a
   BuildKit `RUN`, and BuildKit content-addresses each `RUN` by its inputs — chiefly
   the parent filesystem state, which includes the copied-in app source. When an input
   is unchanged, the vertex is served from cache and **does not execute**.
2. **Lifecycle buildpack cache (`/cache`).** A persistent cache mount
   (`llb.AsPersistentCacheDir`) where the lifecycle stores and reuses buildpack layers
   (downloaded dependencies, compiled artifacts). This matters when the builder phase
   *actually runs* (e.g. the source changed): buildpacks run but reuse their cached
   work rather than redoing it. The lifecycle exporter writes this cache as part of its
   normal operation — no custom cacher binary is needed (contrast the cnbp prior art,
   which shipped one only because it replaced the exporter; see Prior Art).
3. **BuildKit registry cache (`--buildkit-cache-from`/`--buildkit-cache-to
   type=registry`).** Exports/imports the vertex cache to a registry so a cold or
   ephemeral CI runner can import a warm cache and behave like a rebuild on its first
   run.

### Unchanged-source rebuilds skip buildpack execution entirely

The most important consequence of layer 1: on a rebuild where the app source is
unchanged, **the buildpacks do not run at all.** BuildKit marks the `detector`,
`restorer`, `builder`, and `exporter` `RUN` vertices `CACHED` and reuses their results.
The `builder` phase being `CACHED` is the direct evidence that buildpack execution is
skipped; even the per-layer assembly copies are `CACHED`. This is what turns a
~single-digit-second rebuild out of a cold build measured in minutes (see Performance).

One phase is a deliberate exception: the **analyzer** may still run (briefly, ~1–2s)
because it inspects the *remote target image*, which is registry state outside
BuildKit's cache key, so BuildKit cannot assume it is unchanged. On a pure no-change
rebuild the buildpack cache mount (layer 2) is not even exercised — layer 1
short-circuits everything above the analyzer.

## The lifecycle contract

### Build-phase label: `io.buildpacks.lifecycle.prepared-metadata`

A single JSON config label (with a versioned `schema` field) carrying the ordered
layer plan and the emitted CNB labels/env/entrypoint. It is namespaced distinctly
from `io.buildpacks.lifecycle.metadata`; the build phase never pre-writes a valid
final label. New fields can be added without adding image layers.

### The plan (conceptual shape)

```jsonc
{
  "schema": "buildkit-native-export/v1",
  "runImage": {
    "reference": "<run-image ref or digest>",   // for lifecycle-metadata + rebase
    "topLayer":  "sha256:<diffID>"               // rebase boundary
  },
  "layers": [                                    // ordered, bottom to top
    {
      "id": "<buildpack-id:layer | launcher | app | sbom>",
      "reused": false,
      "diffID": "sha256:<intended diffID>",
      "source": {                                // filesystem source to llb.Copy from
        "dir": "/layers/<bp>/<layer>",
        "include": ["..."],                      // optional (app slices)
        "uid": 1001, "gid": 1001, "mode": 493,
        "dest": "/cnb/lifecycle/launcher"        // optional
      },
      "history": { "createdBy": "...", "author": "...", "comment": "..." }
    },
    { "id": "<run-image base layer>", "reused": true, "diffID": "sha256:<diffID>" }
  ]
}
```

New (`reused:false`) layers carry a **source reference**, not a tar; BuildKit copies
from that source. Synthesized layers with no filesystem source (e.g. process-types
symlinks) fall back to a tiny (kilobytes) emitted tree. Reused layers carry only a
diffID and reference the run image's original blob. The `schema` is versioned; any
shape change bumps it and is mirrored in the pack-side consumer.

### finalize: author, don't patch

Given the built+pushed image (single image or manifest list), finalize:

1. reads the config's produced `RootFS.DiffIDs` (in order) + existing labels;
2. reads the prepared-metadata plan;
3. maps plan entries → produced diffIDs positionally (new layers occupy the trailing
   positions; reused layers correspond to run-image base diffIDs);
4. builds `files.LayersMetadata` with every per-layer `sha` = produced diffID and
   `runImage.topLayer`/`reference` from the plan, plus the other CNB labels;
5. sets `io.buildpacks.lifecycle.metadata` (and optionally KEEPs the prepared-metadata
   label for self-healing), changing **no layers**;
6. re-pushes config + manifest (+ index). Tag-atomic and idempotent.

Because the metadata is built **from** the produced diffIDs the first time, there is
no "emitted vs produced" mismatch to reconcile — finalize never writes a wrong SHA.

## New lifecycle commands / flags

The finalize logic lives in the lifecycle as an importable library **and** a
subcommand wrapper. This keeps CNB-metadata authorship in one place (the lifecycle),
consumed by any platform:

- **`finalize` (subcommand + `phase/finalize` library):** authors
  `io.buildpacks.lifecycle.metadata` on a built+pushed image from its produced
  diffIDs + prepared-metadata label. Pack calls the library post-push like
  `phase.Rebaser`; the subcommand enables standalone/self-healing use.
- **emit-mode flag on the exporter:** opt-in mode that records the plan + config +
  per-layer source refs and writes the prepared-metadata label instead of pushing an
  image.
- **`-keep-prepared-metadata-label`:** retains the prepared-metadata label on the
  finalized image so an interrupted build can be self-healed later.
- **`-skip-chown`:** skip `EnsureOwner` chown in the unprivileged BuildKit
  environment (the BuildKit LLB API does not expose uid/gid on cache mounts). This is
  the only additive analyzer/restorer/exporter flag required.

## Runnable without finalize, and user-facing fix commands

A key property of build-then-finalize: **the image BuildKit pushes is already a
runnable app image** (correct base, layers, launcher, entrypoint, env). Finalize only
authors metadata; it never changes layers. So if finalize is interrupted (crash,
network blip), the tag still resolves to a runnable image — it is simply not yet
rebuildable/rebaseable until the CNB metadata is authored.

Because the fix is **metadata-only**, it is cheap and safe to apply after the fact.
Pack ships an `image-metadata` command group for exactly this:

- **`pack image-metadata inspect <image>`** — read-only; reports the image's state
  (`finalized` / `needs-apply` / `not-cnb-native`). Always exits 0 (matches pack's
  `inspect` convention).
- **`pack image-metadata verify <image>`** — same read-only check, but pass/fail
  **exit code** (0 only when finalized). Intended as a CI gate.
- **`pack image-metadata fix <image>`** — idempotent finalize/apply of CNB metadata
  on an already-pushed image (reuses the lifecycle finalize path). Re-running is a
  no-op. `--keep-prepared-metadata-label` mirrors the lifecycle option.

Because `fix` only rewrites the config + manifest, **the layers never change** — the
image's content (and any running containers' pulled layers) is unaffected; only the
metadata the platform reads for rebuild/rebase is corrected.

Repairing an image is intentionally kept OUT of `pack build`: the build command
builds. If a build's finalize step does not complete (e.g. an interrupted build), the
pushed image still carries the `io.buildpacks.lifecycle.prepared-metadata` label, so
it can be finalized later — either by re-running the build, or by running
`pack image-metadata fix` on demand (or draining a dead-letter queue of such images),
since everything finalize needs is in that label.

## Platform Spec Compliance

- Lifecycle phases run in spec order (analyze → detect → restore → build → export/
  emit).
- Buildpack-code phases (detector, builder) run as the CNB user and do **not** have
  registry credentials; analyzer/exporter receive auth via `CNB_REGISTRY_AUTH`.
- The buildpack cache is scoped per-architecture.
- emit-mode records exactly what the exporter does for the **negotiated Platform API**
  (0.7–0.15), so the plan/config are correct for any supported version with no
  per-version logic in the recorder. The emitted config carries `CNB_PLATFORM_API`.

## Multi-arch assembly

Per-platform solves run in parallel; BuildKit assembles the per-arch results into one
OCI index and pushes it atomically. Finalize then authors metadata per child and
re-pushes the index. No intermediate per-arch tags are created.

# Drawbacks
[drawbacks]: #drawbacks

## Layer diffIDs differ from a normal registry-mode build

Because BuildKit assembles the layers, their diffIDs differ from what the lifecycle's
own exporter would produce for the "same" build. This is expected. Finalize makes the
per-layer metadata SHAs match the actual layers, so **rebase and buildpack-layer
patching both work** (rebase depends only on the run-image `topLayer` boundary and on
the base being the run image's layers, not on cross-mode digest identity). This was
validated across repeated rebuilds, rebases, and rebuild-after-rebase, single- and
multi-arch.

## Finalize is a second registry operation

The push and finalize are two steps. If finalize fails, the image is runnable but not
yet rebuildable/rebaseable until finalized (re-run the build, or run
`pack image-metadata fix`). Finalize is idempotent and tag-atomic, so retrying is
safe.

## QEMU emulation performance

Cross-architecture builds via QEMU are slower than native, sometimes dramatically so
for CPU-heavy work. On GitHub-hosted amd64 runners the arm64 half of each build runs
emulated; for most sample apps this adds a few minutes, and it is most pronounced for
apps whose buildpacks do heavy native work (e.g. python/poetry) — see the Performance
section for measured cold-vs-rebuild numbers. This is inherent to emulation, not to
this design: building each architecture on a native runner (BuildKit `--append`
multi-node builds) or importing a warm registry cache removes the emulation cost, and
are the intended path for CI at scale. Both are future optimizations.

## Requires the `docker-container` driver; output modes

Multi-platform builds require the `docker-container` buildx driver.

`--publish` controls what the build EMITS:

- **With `--publish`**, the engine assembles and pushes the image / manifest list to
  the registry and pack finalizes it (the fully-supported path).
- **Without `--publish`**, the build runs in **verify-only** mode: every requested
  platform is built (so a per-commit CI gate proves the build works on all arches),
  but NO image is emitted — no registry push, no local-daemon load, no OCI layout.
  The result stays in the BuildKit builder's content cache; a caller who wants the
  image re-runs with `--publish` or extracts it from the cache themselves. Finalize is
  skipped (there is nothing pushed to author metadata onto), so a verify-only image is
  runnable-from-cache but not CNB-finalized. This is the intended "does it build?"
  gate — e.g. building on every commit without pushing anywhere.

A manifest list cannot be loaded into a local Docker daemon, which is why multi-arch
no-publish is verify-only rather than a daemon load. Loading a *single-arch*
no-publish build into the local daemon (so it is immediately runnable locally, like
`docker build` without `--push`) is deliberately out of scope for now — see the open
questions.

# Alternatives
[alternatives]: #alternatives

## Status quo (manual per-architecture builds)

Run `pack build` per arch, then manually assemble the manifest list. Works, but slow,
error-prone, and without unified caching.

## OCI-layout import (make the engine use the lifecycle's exact layers)

This was the most promising alternative, and on paper it is the cleanest: have the
lifecycle exporter write the finished app image to disk as an OCI layout, and import
that layout into BuildKit (which natively supports importing OCI-layout images via
`llb.OCILayout`). It provides everything needed — the layout already contains the
correct layers, diffIDs, and CNB metadata — so BuildKit could assemble the multi-arch
index directly and **no finalize step would be required at all**.

We rejected it for one reason: **build performance.** Producing the OCI layout means
the lifecycle writes the entire app image — every layer, plus the run-image base — to
disk, and BuildKit then imports (copies) that whole image into its content store
before it can push. For real apps that is a large amount of image data copied on every
build, and it dominates build time. emit/finalize avoids this: the layers stay in
BuildKit's content store and are assembled in place, so only small metadata moves and
the copying is eliminated. The cost of that choice is the finalize step (authoring CNB
metadata from the produced diffIDs), which is a cheap, config-only registry operation —
a good trade for keeping builds fast.

## Post-push metadata-SHA rewrite (patch, not author)

An intermediate spike emitted metadata with the intended diffIDs and had pack rewrite
the SHAs post-push. Superseded by finalize authoring metadata from the produced
diffIDs, which keeps a single source of truth in the lifecycle and never writes a
wrong SHA.

## Custom BuildKit frontend replacing the exporter (cnbp)

Reimplement export as hand-written LLB (see Prior Art). Rejected because it discards
CNB fidelity (proper metadata, layer reuse, SBOM, process types).

# Prior Art
[prior-art]: #prior-art

## cnbp (EricHripko) — a custom BuildKit frontend for CNB

[`EricHripko/cnbp`](https://github.com/EricHripko/cnbp) (~2020–2021) is a **custom
BuildKit frontend** that implements the CNB Platform spec as an LLB graph and —
critically — **replaces the lifecycle exporter** with a custom LLB export step:
it starts `FROM <run-image>` and `llb.Copy`s the launch layers, launcher, app, and
metadata, then returns the state to BuildKit, which owns push/caching/manifest-list
assembly.

cnbp proved the essential pattern this RFC relies on:

- Assembling the final image **as an LLB graph** (`FROM run-image` + copy layers) is
  what lets the build engine own the output image, cache each layer independently, and
  assemble multi-platform manifest lists **natively with no intermediate tags**.

But cnbp had fidelity gaps that make it unusable as-is:

- It **replaced** the lifecycle exporter, so it lost proper
  `io.buildpacks.lifecycle.metadata`, layer reuse from a previous image, SBOM, process
  types; it targeted Platform API 0.5; it shipped a custom cacher; and it hardcoded the
  analyzer previous image. Rebuild/rebase/patching all depend on exactly the metadata
  it threw away.

**Why emit/finalize is the final piece of the puzzle.** cnbp showed BuildKit *can*
assemble a CNB image, but left open the question of how to keep full CNB fidelity when
the engine — not the lifecycle — computes the diffIDs. emit/finalize resolves it
without a custom frontend: the lifecycle **keeps** its exporter logic (metadata/SBOM/
reuse computation) in emit-mode and surfaces the plan; pack assembles `FROM run-image`
via in-process `llb.Copy` from the emitted **sources**; and the lifecycle **finalize**
library authors `io.buildpacks.lifecycle.metadata` from the engine's produced diffIDs.
This combines cnbp's native-assembly insight with the real lifecycle's fidelity, adds
no custom frontend, and materializes no layer tars.

## Other prior art

- [CNB LFX BuildKit POC (2024)](https://github.com/jericop/cnb-lfx-buildkit-poc):
  earlier POC running the lifecycle inside BuildKit via a generated Dockerfile.
- [RFC 0128: Multi-platform support for builders and buildpack packages](https://github.com/buildpacks/rfcs/blob/main/text/0128-multiarch-builders-and-package.md):
  the multi-arch builders/packages this RFC builds on for app images.
- [Rebase Buildpack Contributed Layers (draft)](https://github.com/buildpacks/rfcs/blob/jab/buildpack-layer-patching/text/0000-rebase-buildpack-contributed-layers.md):
  once merged, images built this way support selective buildpack-layer patching,
  because finalize makes each metadata `sha` correspond to the real assembled layer.

# Performance
[performance]: #performance

Measured in CI (the `benchmark-perf.yml` workflow) against the published multi-arch
builder (bundled lifecycle), building `linux/amd64,linux/arm64` and publishing to a
registry. Every cell runs on its **own clean GitHub-hosted runner** (amd64), so each
is a genuine cold build with no cross-run cache bleed. Builder + run images are
warmed before timing so image pull is excluded. "Cold" = first build; "rebuild" =
identical re-run (warm cache); "rebase" = run-image swap. Times are wall-clock
seconds.

| App | Cold (s) | Rebuild (s) | Speedup | Rebase (s) |
|-----|---------:|------------:|--------:|-----------:|
| go/mod          | 322.12 | 17.70 | 18.20x | 4.37 |
| python/poetry   | 383.90 | 19.82 | 19.37x | 5.62 |
| nodejs/npm      | 175.81 | 10.89 | 16.14x | 3.27 |
| java/maven      | 303.02 | 13.51 | 22.43x | 3.83 |
| java/java-node  | 170.36 | 11.25 | 15.14x | 3.29 |

Observations:

- **Rebuilds are dominated by cache hits.** Because every phase and assembly copy is
  content-addressed in BuildKit, an unchanged rebuild finishes in low double-digit
  seconds even for large dependency trees (python/poetry: ~384s cold → ~20s), and
  the rebuild time is roughly constant regardless of how expensive the cold build was.
- **Rebase is metadata-boundary work only** (~3–6s): swap the run-image base, preserve
  app/buildpack layers, re-author the boundary — no rebuild.
- **Cold multi-arch is dominated by QEMU.** On amd64 runners the arm64 half of each
  build runs under emulation, so cold time tracks emulated CPU work: python/poetry
  (see the table) is the heaviest because it installs a CPython runtime and native
  wheels for the emulated arch. (An earlier revision compiled CPython from source under
  emulation, which was dramatically slower; advertising the target/stack env to the
  lifecycle — see Implementation — lets the buildpack install a prebuilt CPython
  instead, cutting that cell by roughly an order of magnitude.) Native runners (or the
  remote registry cache below) remove the emulation cost entirely.
- **No layer egress.** Layer data stays in BuildKit's content store; only small
  metadata crosses to the host for finalize, so wall time tracks real build work
  rather than image-copy IO.
- **Remote cache** (`type=registry`) lets a cold/ephemeral CI runner import the warm
  cache and approach rebuild timings on the first run.

## Single-arch: buildkit backend vs the standard daemon build

To isolate the backend's effect from multi-arch/emulation, the two backends were
also compared **single-architecture, host-native** (the runner's amd64, no QEMU),
with everything else held constant — the same `pack` binary, the same builder, the
same run image, each on its own clean runner. The only differences are the backend
and its natural output target: the standard `docker-daemon` backend builds to the
local Docker daemon (its normal mode, no publish), and the `buildkit` backend
publishes to a registry. Each backend uses its own cache (the daemon build reuses
pack's automatic docker volume cache; buildkit uses its vertex/layer cache). Times
are wall-clock seconds; "Δ" is buildkit ÷ daemon (`< 1.00x` = buildkit faster).

| App | daemon cold | daemon rebuild | buildkit cold | buildkit rebuild | cold Δ | rebuild Δ |
|-----|------------:|---------------:|--------------:|-----------------:|-------:|----------:|
| go/mod         | 36.39 | 18.21 | 97.36 | 13.13 | 2.68x | 0.72x |
| nodejs/npm     | 22.59 |  8.80 | 63.81 | 10.16 | 2.82x | 1.15x |
| java/maven     | 48.95 | 12.28 | 82.32 |  9.06 | 1.68x | 0.74x |
| java/java-node | 25.92 | 10.02 | 61.64 |  9.02 | 2.38x | 0.90x |
| python/poetry  | 39.82 | 24.96 | 83.67 |  8.53 | 2.10x | 0.34x |

Reading these:

- **On a single host-native arch the daemon backend is faster cold** (cold Δ
  1.88x–2.90x). This is expected and fair: the daemon build runs in-process against
  the local Docker daemon with no publish step, while the buildkit backend pays to
  spin up the `docker-container` builder, populate its vertex cache from cold, and
  push the result to a registry. For a one-off, single-arch, non-published build the
  daemon path has less to do.
- **Rebuild is faster with buildkit on almost every app** (rebuild Δ 0.34x–1.15x).
  buildkit's rebuild lands at a near-constant ~9–13s regardless of app size, so it
  beats the daemon on the heavier apps — by the widest margin on the heaviest
  dependency tree (python/poetry 0.34x) — and is roughly at parity on the lightest
  (nodejs/npm 1.15x, where the daemon's warm rebuild is already ~9s and buildkit's
  fixed ~10s floor is marginally higher). BuildKit's advantage is that flat rebuild
  cost — its vertex cache skips buildpack execution entirely (see Caching) — which the
  multi-arch table above shows dominating once a second architecture (or emulation) is
  in play.
- **Net:** single-arch and native, the daemon backend is the cheaper one-shot cold
  build; the buildkit backend is faster on every rebuild and is what unlocks
  multi-arch and published images — which is exactly what this proposal targets.

> These are single-run CI numbers on GitHub-hosted amd64 runners; treat them as
> directional (cold builds in particular vary with runner load and network). The
> `benchmark-perf.yml` workflow reproduces the whole matrix — each app ×
> {docker-daemon-single, buildkit-single, buildkit-multi} on its own clean runner —
> on every push, and prints the combined table as raw markdown.

## Multi-arch: buildpacks vs plain Dockerfiles (both via BuildKit)

A different question: how much does the buildpacks path cost versus just writing a
Dockerfile, when *both* go through BuildKit multi-arch? Since the buildkit backend
runs the lifecycle inside BuildKit, this isolates buildpacks overhead (detect,
analyze, SBOM, the lifecycle phases) from BuildKit itself. Each app was built
`linux/amd64,linux/arm64` and pushed, three ways, each on its own clean runner:

- **buildpacks-multi** — `pack build --build-backend buildkit`.
- **cnb-like-dockerfile** — a Dockerfile that mirrors what the buildpacks actually
  do: ubuntu base, download the runtime (Go dist / Node / Liberica JDK+JRE) from its
  web release and install it, then build the app. Same *work*, hand-written.
- **generic-dockerfile** — a standard idiomatic Dockerfile (ubuntu base, toolchain
  via `apt`) — the "what most people write" baseline.

Cold = `--no-cache` first build; rebuild = warm cache. Wall-clock seconds.

| App | Build type | Cold (s) | Rebuild (s) |
|-----|------------|---------:|------------:|
| go/mod        | buildpacks-multi          | 335.40 | 11.53 |
| go/mod        | cnb-like-dockerfile       | 277.26 |  3.35 |
| go/mod        | generic-dockerfile        | 155.20 |  4.93 |
| nodejs/npm    | buildpacks-multi          | 199.24 | 15.46 |
| nodejs/npm    | cnb-like-dockerfile       | 137.88 |  3.62 |
| nodejs/npm    | generic-dockerfile        | 289.52 |  3.59 |
| java/maven    | buildpacks-multi          | 342.06 | 21.86 |
| java/maven    | cnb-like-dockerfile       | 236.72 |  3.31 |
| java/maven    | generic-dockerfile        | 212.99 |  3.69 |
| python/poetry | buildpacks-multi          | 378.83 | 10.59 |
| python/poetry | cnb-like-dockerfile       | 213.26 |  3.90 |
| python/poetry | generic-dockerfile        | 430.36 |  4.35 |

Reading these:

- **Cold, buildpacks cost more — but the gap is mostly *what work is done*, not
  BuildKit and not the lifecycle structure.** Both paths run through BuildKit, so
  "BuildKit overhead" does not explain the difference. Profiling the python cold build
  natively (arm64, no QEMU) breaks the ~1.8x gap down cleanly: the lifecycle "tax"
  (detector ~12s, analyzer/restorer/exporter ~10s, the finalize assemble-copies ~9s)
  is only ~30s and bounded; the dominant cost is inside the *builder* phase, where the
  Paketo `cpython` buildpack's "Installing CPython" step alone took ~93s versus the
  cnb-like Dockerfile untarring a prebuilt CPython in a fraction of that. The
  buildpack also installed a newer Python (3.14 vs the Dockerfile's pinned 3.12). In
  other words, the buildpack does more/heavier work by default (and stays current on
  versions); it is not doing the same work less efficiently. The generic (apt)
  Dockerfile is not uniformly fastest either — it wins on go but is slowest on nodejs
  (apt pulls a large dependency tree) — so "just use apt" is not a free win.
- **Rebuild, everything is fast, but Dockerfiles are ~3–6x faster than buildpacks.**
  Dockerfile rebuilds hit BuildKit's layer cache and finish in ~3–5s; buildpacks land
  at ~11–22s because the lifecycle still runs detector/analyzer on every build even
  when the resulting layers are cached. That fixed lifecycle cost is the price of what
  buildpacks give you over a Dockerfile — reproducible detection, SBOM, rebase,
  automatic version selection, and no hand-maintained build recipe.
- **Net:** buildpacks are not trying to beat a Dockerfile on raw build time; they
  trade a modest, bounded lifecycle overhead (plus whatever extra work the buildpacks
  choose to do, e.g. installing a current CPython from scratch) for automation and
  supply-chain features. Crucially, running the lifecycle *inside BuildKit* keeps the
  backend itself out of the critical path — the measured overhead is buildpack work
  and lifecycle phases, not the buildkit backend being inefficient.

> Single-run CI numbers on GitHub-hosted amd64 runners (arm64 half emulated via
> QEMU), so cold times carry emulation cost; treat as directional. The
> `benchmark-dockerfile-vs-buildpacks.yml` workflow (workflow_dispatch) reproduces
> this table. python/poetry is included but its emulated cold build is the slowest
> cell (and the generic-apt Dockerfile is actually slowest of the three there, as apt
> compiles/pulls a heavy chain under emulation); java/java-node is out of scope for
> this comparison.

# Implementation
[implementation]: #implementation

## Proof of concept

Working across repositories, all on the shared `buildkit-native-export` branch and
`buildkit-native-export-v0.1.0` tag:

- **jericop/cnb-lifecycle** (`buildkit-native-export`): exporter emit-mode (`phase/emit`,
  `layers/` source refs) computing the plan + `io.buildpacks.lifecycle.prepared-metadata`
  label, and the `phase/finalize` library + subcommand authoring
  `io.buildpacks.lifecycle.metadata` from produced diffIDs. Adds `-skip-chown`.
  Published as `jericop/lifecycle:buildkit-native-export-v0.1.0`.
- **jericop/cnb-pack** (`buildkit-native-export`): the single `buildkit` backend —
  in-process gateway BuildFunc assembling `FROM run-image` via `llb.Copy` from emitted
  sources, then `finalize.Finalize` post-push; the `image-metadata` command group
  (inspect/verify/fix). `go.mod` pins the lifecycle to the tag via `replace`.
- **jericop/ubuntu-noble-builder** (`buildkit-native-export`): builder bundling the
  pinned lifecycle; published multi-arch as
  `jericop/ubuntu-noble-builder:buildkit-native-export`.
- **jericop/pr-compliance-app**: CI exercising builds against the builder image.

## Build environment: parity with standard pack

Because the lifecycle runs inside BuildKit rather than in a pack-managed container,
the backend is responsible for reproducing the build environment that standard pack
normally provides. The implementation passes the same three categories of
environment through to the lifecycle phases (as process env, and — for user build
config — as files under `/platform/env`, the CNB platform contract):

1. **CNB platform environment** that the lifecycle and buildpacks require:
   `CNB_PLATFORM_API`, `CNB_USER_ID`, `CNB_GROUP_ID`, `CNB_STACK_ID`,
   `CNB_TARGET_OS`, `CNB_TARGET_ARCH`, `CNB_TARGET_ARCH_VARIANT`,
   `CNB_TARGET_DISTRO_NAME`, `CNB_TARGET_DISTRO_VERSION`, `CNB_EXPERIMENTAL_MODE`,
   `SOURCE_DATE_EPOCH`, and `CNB_REGISTRY_AUTH`. The target/stack values are sourced
   from the builder image and the per-platform target. These matter for correctness,
   not just metadata: without `CNB_STACK_ID` + the target vars, a buildpack's
   dependency resolver cannot match stack/target-specific **prebuilt** dependencies
   and falls back to a source build — e.g. the CPython buildpack compiled CPython
   from source (~90s under emulation) instead of installing a prebuilt binary (~10s).
2. **User build-time environment** — `pack --env` / `--env-file` and project
   descriptor `[[build.env]]` — written to `/platform/env/<NAME>` so buildpacks read
   it as `BP_*` configuration (e.g. `BP_CPYTHON_VERSION`, `BP_JVM_VERSION`). This is
   how a user pins a runtime version or toggles buildpack behavior, and it works in
   the buildkit backend exactly as with standard pack.
3. **Proxy environment** — `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` (upper and lower
   case), resolved from explicit options or the host environment, so buildpacks that
   download dependencies work behind a corporate proxy.

The backend also **extracts build artifacts to the host** to match the daemon
backend's copy-out: `--report-output-dir` writes `report.toml`, and
`--sbom-output-dir` writes the full SBOM tree (`build/` + `launch/` + `cache/`,
cdx/spdx/syft). These are read out of the built image state via BuildKit's gateway
`ReadFile`/`ReadDir` API (the analog of the daemon's container copy-out); for a
multi-arch build each platform's output is namespaced under `<dest>/<os>-<arch>/`.

Deliberately **not** passed (not applicable to a publish-only, registry-export
backend): `CNB_USE_LAYOUT` / `CNB_LAYOUT_DIR`, which only apply to local OCI-layout
export. Reviewers evaluating completeness should compare against pack's standard
phase configuration; the categories above are the ones a buildpack author or platform
operator depends on, and any newly added platform env in a future lifecycle/platform
API would need to be threaded here as well.

## `pack build` flags the buildkit backend does NOT support

Some `pack build` flags are specific to the standard `docker-daemon` backend. Rather
than silently ignore them on the `buildkit` backend, the CLI **rejects** them with a
message pointing at the buildkit-native equivalent (or explaining why they don't
apply). Which flags a backend supports is expressed as a backend CAPABILITY, so the
rule lives with the backend rather than as a CLI special-case — the same mechanism
that decides how many `--platform` values a backend accepts.

| Flag | Behavior on buildkit | Why |
|------|----------------------|-----|
| `--cache`, `--cache-image` | rejected | These configure the **lifecycle cache** (build-layer cache stored as a volume or a registry cache image). The buildkit backend uses BuildKit's own content-addressed vertex/layer cache instead; use `--buildkit-cache-from` / `--buildkit-cache-to` (which mirror `docker buildx`). |
| `--clear-cache` | rejected | The buildkit backend only ever **pushes** to a registry and never deletes from one, so "clear the image's associated cache" has no meaning. |
| `--previous-image` | rejected | On the daemon backend this makes the analyzer read a prior image's layer metadata + SBOM so the exporter reuses unchanged layers **by reference**. The buildkit build-then-finalize model already gets that layer-blob reuse from BuildKit's content-addressed cache (an unchanged layer keeps its digest and is not re-pushed), and finalize authors metadata from the **actual produced layers** rather than from a prior tag. The only distinct benefit — metadata/SBOM continuity across a retag — is a niche case left out of scope. |
| `--volume` | rejected | Mounts a live host path into the lifecycle **container** (read-only or read-write). BuildKit builds in a sandbox with no `docker run -v` equivalent: read-write host mounts are structurally impossible, and read-only host data would be a point-in-time `llb.Local` sync rather than a live bind. Rejecting is more honest than silently changing the semantics. Read-only config/secret delivery (the CNB **bindings** use case) is a candidate for a dedicated future mechanism via BuildKit secret mounts — see the volumes/bindings spike. |

Notes on the boundary:

- **`--tag` IS supported** — publishing an image under multiple tags is universal to
  registry backends. BuildKit's image exporter is given all names at once, and
  finalize runs per tag so every published tag is CNB-compliant.
- **`--sbom-output-dir` / `--report-output-dir` ARE supported** — the backend reads
  the report + SBOM tree out of the built image state and writes them to the host
  (see the parity section above), matching the daemon backend's copy-out.
- **`--workspace`, `--uid`, `--gid`, and `--exec-env` ARE supported** — these map
  cleanly onto the buildkit path and are honored (not rejected). `--workspace` sets
  the app-directory mount path used by the app copy, the workspace `chmod`, and the
  `-app` arg on the detector/builder/exporter (default `/workspace`). `--uid` /
  `--gid` override the user/group the lifecycle runs as, and the user override wins
  over the builder image's own ids, matching the daemon `-uid`/`-gid` semantics.
  `--exec-env` is passed to detect/build as `CNB_EXEC_ENV`, gated on Platform API
  `>= 0.15` (the same gate the daemon backend uses) since older lifecycles reject the
  variable. All four are threaded as first-class backend inputs rather than hardcoded
  phase args.
- **`--buildpack` / `--pre-buildpack` / `--post-buildpack` / `--buildpack-registry`
  ARE supported**, including adding buildpacks that are NOT already in the builder
  and OVERRIDING a builder buildpack with a local copy of the same id/version (the
  "test a buildpack change" workflow). This is where the backend leans on a
  BuildKit-native optimization: the standard daemon path resolves the requested
  buildpacks and bakes them into a throwaway **ephemeral builder image**; the
  buildkit backend skips that image entirely and instead injects the resolved
  modules directly into the builder's `/cnb/buildpacks` **within the LLB graph**
  (synced in as a local, copied over the builder before detect). Crucially, pack
  does NOT re-decide anything: it reuses the SAME resolved detection order and the
  SAME fetched modules that `processBuildpacks` already computed (covering image,
  local dir/tarball, and `urn:cnb:registry` refs), and serializes the order with
  pack's own canonical order.toml writer — so precedence
  (builder → descriptor → `--buildpack`, with pre/post prepend/append) is identical
  to the daemon. The injected modules exist only in the transient builder state (the
  final image is assembled from the run image), so they never leak into the output,
  and injecting them keeps the graph cache-friendly on rebuild.
- **`--creation-time` IS supported** — it sets the produced image config's `created`
  timestamp (from `SOURCE_DATE_EPOCH`, gated on Platform API `>= 0.9` like the
  daemon). Note this needed explicit handling: the buildkit exporter runs in
  emit-mode (it records the plan rather than pushing), so the exporter's normal
  timestamp path is bypassed and the backend sets `created` when it authors the final
  image config; the finalize step preserves it.
- **`--descriptor` IS supported**, including its `project.toml` `[build]`
  `include`/`exclude` file filter, which is applied to the app source synced into the
  build so excluded files never enter the build context (matching the daemon's
  file-filtered app copy). The descriptor's build env and declared buildpacks flow
  through the same shared resolution as the daemon.
- **`--build-backend buildkit` emits images only via `--publish`** (registry push).
  Without `--publish` it runs verify-only (builds, emits nothing — see the output-modes
  drawback). The daemon-only output concepts it does NOT implement (`-daemon`/
  docker-socket access, load-to-local-daemon, the launch cache, and local `--layout`/
  OCI export) are simply not part of this backend rather than rejected flags.
- **Extensions (`--extension`, image extension) ARE supported.** When the resolved
  order includes extensions, the backend runs the generator (the `generate` phase)
  and applies the emitted build- and run-image Dockerfiles by translating each
  Dockerfile instruction directly into LLB, so the extend happens **inside the build
  engine with no separate extender/kaniko phase** (kaniko-free). The build-image
  Dockerfile extends the environment the buildpacks then detect/build against; the
  run-image Dockerfile extends the base the final app image is assembled `FROM`. A
  documented subset of ten Dockerfile instructions is translated —
  `FROM`, `ADD`, `ARG`, `COPY`, `ENV`, `LABEL`, `RUN`, `SHELL`, `USER`, `WORKDIR` —
  which covers the instructions CNB image extensions are permitted to emit. Because
  each instruction becomes LLB, the extend is applied per platform within the same
  emit graph as the rest of the build, so extensions participate in BuildKit's cache
  and multi-arch assembly like every other phase.
- **`--trust-extra-buildpacks` is not applicable** to this backend. On the daemon it
  only chooses between the single-container "creator" and the multi-phase flow when
  extra buildpacks are added; the buildkit backend always runs its own fixed 5-phase
  flow (there is no creator), so there is nothing for the flag to gate.
- **CNB service bindings ARE supported via `--binding`** (a new repeatable flag,
  `[<name>=]<host path>`), even though `--volume` is rejected. Bindings are
  read-only, small, and target a well-known path, so each binding directory is synced
  in and MOUNTED READ-ONLY at `/platform/bindings/<name>` on the detector + builder
  RUNs (mounted, not copied, so binding secrets never land in a layer). On the
  docker-daemon backend `--binding` is translated to the equivalent `:ro` volume
  mount, so it behaves the same on both backends. Bindings were not first-class in
  pack before (they were delivered as data over `--volume`); `--binding` makes them
  explicit and backend-agnostic. A future hardening delivers binding secrets via
  BuildKit secret mounts (`llb.AddSecret`) so the bytes never enter the LLB graph;
  see the volumes/bindings spike in the spec.

## Retained abstraction for future backends

The `BuildBackend` interface, `BackendType` enum, factory, and `--build-backend` flag
are intentionally kept even though `buildkit` is the only implemented backend, so a
future **buildah** backend (see the Definitions note on buildah vs podman) can consume
the same emit/finalize contract without reworking the abstraction. Because
`--build-backend` is both the opt-in and the engine selector, adding `buildah` is a
new accepted value, not a new top-level flag.

### Evidence the contract is genuinely engine-agnostic (buildah/podman)

A feasibility review of the buildah/podman Go libraries against this contract
confirms the emit/finalize split — not just the retained abstraction — is what makes
a second engine a **backend-only** addition, with **no lifecycle or spec change**.
The value of emit/finalize is precisely that it separates two concerns that a custom
frontend (cnbp) conflated:

- **Who assembles the layers and computes the diffIDs** — the engine (BuildKit
  today; buildah/podman tomorrow), and
- **Who authors the CNB metadata** — the lifecycle `finalize` library, once, from the
  produced diffIDs.

The **build backend** has a single job: run the lifecycle phases, assemble the app
image (`FROM run-image` + the emitted layers + config), and push it. Authoring the CNB
metadata (`finalize`) is **not** the backend's job — it is the lifecycle's, invoked by
pack after the backend returns.

That is what makes a new engine cheap to add: of the two pieces of the overall flow,
only the backend piece is engine-specific and needs to be written; the finalize piece
is reused unchanged.

- **Finalize — reused as-is, not re-implemented.** `finalize` is pure registry-side
  work (go-containerregistry `remote`/`mutate`) on the pushed image or index; it does
  not know or care which engine built the image, so a buildah backend gets it for
  free. The `io.buildpacks.lifecycle.prepared-metadata` label and the emit recorder
  namespacing were likewise defined builder-agnostic from the start.
- **The backend — the only engine-specific code to write.** Its assemble-and-push job
  maps cleanly onto buildah's daemonless Go API:

  The steps run in this order (the run image is not known until the analyzer has run,
  and there is nothing to assemble until the exporter has emitted):

  | # | Backend step | buildah Go API |
  |---|---|---|
  | 1 | Start the build container **FROM the builder image** | `buildah.NewBuilder(ctx, store, BuilderOptions{FromImage: <builder-image>})` |
  | 2 | Run analyze → detect → restore → build in it | `builder.Run([]string{…}, RunOptions{…})` per phase |
  | 3 | Run the **exporter in emit-mode** (`-emit-export-plan <dir>`) so it records the plan + config instead of pushing an image | `builder.Run([]string{"/cnb/lifecycle/exporter", "-emit-export-plan", <dir>, …}, RunOptions{…})` |
  | 4 | Read the emitted plan/config; resolve the run image from the analyzer output | (read files from the build container) |
  | 5 | Start the app image **FROM the run image** (from step 4) | `buildah.NewBuilder(ctx, store, BuilderOptions{FromImage: <run-image>})` |
  | 6 | Copy each emitted layer from its source (chowned) | `builder.Add(dest, false, AddAndCopyOptions{Chown:"uid:gid"}, src…)` |
  | 7 | Apply the emitted config | `SetEntrypoint` / `SetCmd` / `SetWorkingDir` / `SetEnv` / `SetLabel` |
  | 8 | Produce + push per-arch image | `builder.Commit(…)` / `buildah.Push(…)` |
  | 9 | Assemble the multi-arch index | the `buildah manifest` API (create → add per-arch → push) |

  Two things are worth calling out. First, there are **two** `FROM`s: the phases run in
  a container based on the **builder** image (step 1), and the final app image is
  assembled on the **run** image (step 5) — the run image is discovered from the
  analyzer's output, so it cannot come first. Second, the exporter must run **in
  emit-mode** (step 3, `-emit-export-plan`): that is what produces the plan + config +
  prepared-metadata the backend assembles from, instead of the exporter pushing a
  finished image itself. A normal (non-emit) export would defeat the whole approach.

  The backend would report `PushesNatively: true`, so the executor skips its own
  assembly/push exactly as it does for BuildKit. Pack then calls the same
  lifecycle `finalize` afterward, unchanged.

The **one** substantive design decision is layer granularity: buildah's default
`container → commit` squashes all added content into a **single** layer, whereas the
CNB contract and `finalize`'s positional (intended→produced) diffID mapping assume
**one image layer per CNB layer**. The supported fix is a **commit-per-layer** chain
(each `Add`+`Commit` adds exactly one layer, in plan order) — the same mechanism
containers/storage uses for `buildah build --layers`. Like BuildKit, buildah computes
its own diffIDs, which is exactly why `finalize` authors metadata from the produced
layers; no contract change is needed.

The remaining caveats are **environmental, not contractual**: buildah/podman are
Linux-only (no macOS local-dev loop like BuildKit's), multi-arch relies on QEMU
emulation per arch, and there is no drop-in equivalent to BuildKit's remote registry
cache (so rebuild performance for ephemeral CI would need separate measurement). None
of these touch the lifecycle contract. In short, adding a second engine reduces to
implementing one assembler and reusing `finalize` — demonstrating that emit/finalize
delivers a genuinely builder-agnostic CNB multi-arch build, not a BuildKit-specific
one.

## Phases

1. **emit-mode (lifecycle):** record the ordered plan + config + per-layer source
   refs; write the prepared-metadata label.
2. **Native assembly (pack):** in-process BuildFunc, `FROM run-image` + `llb.Copy`
   from sources; parallel per-platform; BuildKit pushes one OCI index.
3. **finalize (lifecycle library, called by pack):** author
   `io.buildpacks.lifecycle.metadata` from produced diffIDs; re-push config+manifest(+
   index).
4. **image-metadata command (pack):** inspect / verify / fix for standalone
   verification and self-healing.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

1. Migration path for the lifecycle `finalize` library/subcommand, emit-mode, and
   `-skip-chown` into upstream lifecycle — gate by Platform API version?
2. Should `pack` auto-create a `docker-container` builder when one is missing?
3. Self-heal (`pack image-metadata fix`) is a separate, explicit command today —
   the build command deliberately does not repair images. Should the build ever
   auto-heal a target image that has stale metadata, or stay strictly build-only?
4. Should the prepared-metadata label be retained by default (self-healing) or dropped
   after finalize by default?
5. First-class layer `id` in the plan vs the current history-derived id — worth
   threading an explicit id through the exporter's add/reuse calls?
6. End-to-end app-slice coverage requires a custom buildpack that writes `[[slices]]`;
   is a fixture buildpack in scope for upstreaming?
7. Should a **single-arch** no-publish build LOAD the result into the local Docker
   daemon (so it is immediately runnable locally, like `docker build` without
   `--push`), instead of the current verify-only behavior? Multi-arch cannot (a
   manifest list is not daemon-loadable), but single-arch could via BuildKit's
   `docker` exporter.
8. If (7) loads into the daemon, and the caller requests a SINGLE `--platform` that
   does NOT match the host architecture, do we build (under emulation) and load that
   foreign-arch image too? **This needs verification against what standard `pack`
   does today** — it is believed pack builds+loads a foreign single arch via
   emulation, but that should be confirmed before matching the behavior.

# Spec Changes
[spec-changes]: #spec-changes

This RFC does **not** require changes to the Platform Interface Specification: the
lifecycle phases are invoked with the same arguments and semantics. The build-then-
finalize execution model is a platform implementation detail. The following lifecycle
**implementation** additions are proposed, all additive and opt-in:

- **emit-mode** on the exporter: compute + record the ordered layer plan, image
  config, and per-layer source refs, surfaced as the
  `io.buildpacks.lifecycle.prepared-metadata` label; do not assemble/push an image.
- **`finalize`** library + subcommand: author `io.buildpacks.lifecycle.metadata` on a
  built+pushed image from its produced diffIDs + the prepared-metadata label; re-push
  config+manifest(+index) only.
- **`-keep-prepared-metadata-label`**: retain the prepared-metadata label for
  self-healing.
- **`-skip-chown`**: skip `EnsureOwner` chown for unprivileged execution
  environments.

These do not change default behavior.
