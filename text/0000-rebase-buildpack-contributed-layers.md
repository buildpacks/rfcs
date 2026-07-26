# Meta
[meta]: #meta
- Name: Rebase Buildpack Contributed Layers
- Start Date: 2025-09-12
- Author(s): @jabrown85
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Enable rebase to accept an optional metadata file describing buildpack-contributed layers that should be selectively patched from an OCI image during the rebase operation. This feature will be gated behind experimental flags until a future date.

# Definitions
[definitions]: #definitions

**Buildpack-contributed layers** - Filesystem layers created by buildpacks during the build process, containing application dependencies, component libraries, or other buildpack-specific artifacts.

**Layer patch metadata** - A configuration file that describes which layers in the target image should be replaced with corresponding layers from a patch OCI image.

**Patch image** - An OCI image containing updated buildpack-contributed layers that will replace existing layers in the target image.

**Layer matching** - The process of identifying equivalent layers between target and patch images based on metadata such as buildpack ID, component name, or layer purpose.

# Motivation
[motivation]: #motivation

- **Selective patching**: Enable updating specific components (e.g., component 1.2.* → 1.2.3) without full rebuilds
- **Security vulnerability fixes**: Quickly patch vulnerable dependencies in buildpack layers without rebuilding entire applications
- **Dependency updates**: Allow targeted updates of specific buildpack-contributed components while preserving other layers
- **Operational efficiency**: Reduce the scope of changes during updates, minimizing risk and deployment time

Currently, rebase operations only update base image layers. There's no mechanism to selectively patch specific buildpack-contributed layers, requiring full rebuilds even for minor component updates.

# What it is
[what-it-is]: #what-it-is

This feature extends the rebase command to accept an optional metadata file that specifies buildpack-contributed layers to be patched from a source OCI image.

**Target personas**:
- Platform operators who need to patch specific components across multiple applications
- Security teams responsible for vulnerability remediation
- DevOps teams managing dependency updates

**Key capabilities**:
- Selective layer replacement based on metadata matching
- Support for patching layers from any OCI-compliant patch image
- Preservation of layer ordering and image functionality
- Validation of layer compatibility before applying patches

**Example workflow**:
```bash
# Original image with component 1.2.0 buildpack layer
pack build myapp --builder example/builder:24

# Create patch metadata file to update component from any 1.2.x to 1.2.3
cat > layer-patches.json << EOF
{
  "patches": [
    {
      "buildpack": "example/buildpack",
      "layer": "dist",
      "data": {
        "artifact.version": "1.2.*"
      },
      "patch-image": "registry.example.com/patches/component:1.2.3",
      "patch-image.mirrors": [
        "backup-registry.example.com/patches/component:1.2.3"
      ]
    }
  ]
}
EOF

# Rebase with layer patches (via flag)
pack rebase myapp --layer-patches layer-patches.json

# Or via environment variable
CNB_LAYER_PATCHES_FILE=layer-patches.json pack rebase myapp
```

# How it Works
[how-it-works]: #how-it-works

## Layer Patch Process

The enhanced rebase operation follows these steps:

1. **Parse patch metadata**: Read the layer patches file to understand which layers should be replaced
2. **Analyze target image**: Identify existing buildpack layers and their metadata in the target image
3. **Match layers**: Use metadata selectors to identify which target layers should be replaced
4. **Fetch patch layers**: Pull the specified patch image and locate the equivalent layer using the same buildpack-key and layer-name
5. **Validate compatibility**: Ensure replacement layers are compatible with the target image structure
6. **Apply patches**: Replace matched layers with patch layers while preserving image integrity
7. **Update metadata**: Update image labels and configuration to reflect the layer changes

**All-or-nothing operation**: The patching process is atomic - if any patch fails (due to missing layers, compatibility issues, or access problems), the entire rebase operation is aborted and no changes are made to the target image.

## Metadata File Format

The layer patches metadata file uses JSON format and references the `io.buildpacks.lifecycle.metadata` label structure:

```json
{
  "patches": [
    {
      "buildpack": "example/buildpack",
      "layer": "dist",
      "data": {
        "artifact.version": "1.2.*"
      },
      "patch-image": "registry.example.com/patches/component:1.2.3",
      "patch-image.mirrors": [
        "backup-registry.example.com/patches/component:1.2.3",
        "public.ecr.aws/example/patches/component:1.2.3"
      ]
    }
  ]
}
```

### Matching Logic
The matching operates on the `buildpacks` array within `io.buildpacks.lifecycle.metadata`:
- **buildpack**: Matches `buildpacks[].key` (e.g., "example/buildpack")
- **layer**: Matches keys in `buildpacks[].layers` (e.g., "dist")
- **data**: Generic object for matching any nested structure within `buildpacks[].layers[layer].data`
  - Uses dot notation for nested paths: `"artifact.version"` matches `data.artifact.version`
  - Supports any buildpack-specific data structure
- **Pattern matching**: Support glob patterns like "1.2.*" for version ranges (matches 1.2.0, 1.2.1, 1.2.3, etc.)
- **Multiple criteria**: All specified criteria must match for a layer to be selected

### Patch Layer Selection
- Uses the same `buildpack` and `layer` values to locate the replacement layer in the patch image
- Validates that the patch layer exists and has compatible metadata structure
- Assumes patch and target layers represent the same logical component (e.g., both are "dist" layers from "example/buildpack")

### Registry Fallback Support
- **patch-image.mirrors**: Optional array of mirror registries for the patch image, similar to `runImage.mirrors` in the CNB specification
- **Registry selection**: The system selects the most appropriate registry (primary `patch-image` or a mirror) based on availability and accessibility
- **Fallback behavior**: If the selected registry cannot be accessed, the system tries remaining registries (primary + mirrors) in order
- **Registry resilience**: Provides redundancy for patch operations when registries are unavailable
- **Cross-cloud support**: Enables using different registries for different deployment environments (e.g., public ECR, private registries)

### Patch Compatibility
- **Assumed compatibility**: Patches are assumed to be compatible with the target layers they replace
- **No validation guarantees**: The patching process makes no promises or assurances about functional compatibility beyond basic structural validation
- **Platform responsibility**: Platform operators are responsible for validating patches before rebasing to ensure application correctness
- **Operator discretion**: The level of compatibility validation is left entirely to the platform operator's requirements and testing processes
- **Best practice**: Recommended to test patches in non-production environments before applying to production workloads

### Patch Image Creation
- **Creator responsibility**: Patch images can be created by platform operators or trusted buildpack authors
- **Creation method**: Image creation process is left to the patch creator's discretion
- **Simple approach**: A `pack build` of a minimal application that produces the desired layer is sufficient
- **Layer isolation**: The patch image only needs to contain the specific layers being patched
- **Metadata accuracy**: The patch image must have correct `io.buildpacks.lifecycle.metadata` for the replacement layers

**Example patch image creation**:
```bash
# Create a minimal app to generate updated layer
echo 'minimal app content' > app.txt

# Build with updated buildpack to create patch image
pack build registry.platform.com/security-patches/component:1.2.3 \
  --builder example/builder:24 \
  --buildpack registry.platform.com/buildpacks/example:2.1.0-security-patch

# Push patch image to registry
docker push registry.platform.com/security-patches/component:1.2.3
```

### Real-world Examples

**Example Buildpack** with nested artifact structure:
```json
{
  "buildpacks": [
    {
      "key": "example/buildpack",
      "version": "5.0.1",
      "layers": {
        "dist": {
          "sha": "sha256:07a4155470875608306f01f6a4045aaff4f6f9abaa6cb9f96a9ef6b8bdb440a6",
          "data": {
            "artifact": {
              "version": "1.2.0",
              "url": "https://example.com/download/release/v1.2.0/component-v1.2.0-linux-arm64.tar.gz"
            }
          }
        }
      }
    }
  ]
}
```
Patch configuration:
```json
{
  "buildpack": "example/buildpack",
  "layer": "dist",
  "data": {"artifact.version": "1.2.*"},
  "patch-image": "registry.example.com/patches/component:1.2.3"
}
```

**Hypothetical Java Buildpack** with different structure:
```json
{
  "buildpacks": [
    {
      "key": "example/java",
      "layers": {
        "jdk": {
          "sha": "sha256:abc123...",
          "data": {
            "runtime": {
              "java_version": "17.0.8",
              "build_date": "2023-07-18"
            }
          }
        }
      }
    }
  ]
}
```
Patch configuration:
```json
{
  "buildpack": "example/java",
  "layer": "jdk",
  "data": {"runtime.java_version": "17.0.8"},
  "patch-image": "registry.example.com/patches/java:17.0.9"
}
```

**Simple Buildpack** with flat data structure:
```json
{
  "buildpacks": [
    {
      "key": "example/nginx",
      "layers": {
        "binary": {
          "sha": "sha256:def456...",
          "data": {
            "version": "1.24.0",
            "compiled_date": "2023-08-01"
          }
        }
      }
    }
  ]
}
```
Swap configuration (version-specific):
```json
{
  "buildpack": "example/nginx",
  "layer": "binary",
  "data": {"version": "1.24.0"},
  "patch-image": "registry.example.com/patches/nginx:1.25.0"
}
```

Or patch configuration (version-agnostic):
```json
{
  "buildpack": "example/nginx",
  "layer": "binary",
  "patch-image": "registry.example.com/patches/nginx:latest"
}
```

The generic `data` matching system allows any buildpack to use their own metadata structure while still enabling selective layer replacement.

### Platform-Scale Example

A platform operator managing applications with multiple components can patch all vulnerable components in a single operation.

```json
{
  "patches": [
    {
      "buildpack": "example/other-buildpack",
      "layer": "custom-component",
      "data": {
        "version": "2.4.*"
      },
      "patch-image": "registry.platform.com/security-patches/custom-component:2.4.21"
    },
    {
      "buildpack": "example/buildpack",
      "layer": "dist",
      "data": {
        "artifact.version": "18.18.*"
      },
      "patch-image": "registry.platform.com/security-patches/component:18.18.2"
    }
  ]
}
```

**Operational Benefits:**
- **Single command**: `pack rebase --layer-patches security-patches.json` (or `CNB_LAYER_PATCHES_FILE=security-patches.json pack rebase`) patches all affected applications
- **Selective targeting**: Only applications with vulnerable versions are updated
- **Multiple targets**: Handles diverse component in one operation
- **Version flexibility**: Pattern matching accommodates different patch levels across applications
- **Centralized patches**: All security fixes come from a controlled registry

This approach allows platform operators to respond quickly to security advisories by creating pre-built patched images and applying them across their entire application portfolio without coordinating individual rebuilds.

## Implementation Details

### Lifecycle Integration
- Extend the rebaser component to support layer patch metadata
- Add new command-line flags to lifecycle `rebaser`: `--layer-patches` and environment variable `CNB_LAYER_PATCHES_FILE`

### Patched Image Construction
- **Layer referencing**: When constructing the patched image, layers from the `patch-image` maintain references to their original patch image
- **Anonymous blob mounts**: Supports OCI Distribution 1.1 anonymous blob mounts, allowing registries to efficiently share blob data between images without duplicating storage
- **Cross-repository mounting**: Layers can be mounted from the `patch-image` repository to the target image repository using blob mount operations
- **Fallback handling**: If anonymous blob mounts are not supported by the registry, the system falls back to traditional layer copying
- **Manifest construction**: The resulting image manifest includes proper references to enable future blob mount operations

### Lifecycle Metadata Updates
- **Accurate metadata**: The lifecycle must ensure `io.buildpacks.lifecycle.metadata` label accurately reflects the final patched state
- **Layer information copying**: When a layer is patched, the corresponding layer metadata (SHA, data) is copied from the `patch-image` metadata
- **Buildpack version updates**: If the patch includes updated buildpack versions, this information is reflected in the metadata
- **Data preservation**: Layer data structures from the patch image replace the original layer data to maintain accuracy
- **Metadata validation**: The system validates that copied metadata is structurally compatible with the existing metadata schema

Example metadata update for a component patch:
```json
// Before patch (from target image)
{
  "buildpacks": [
    {
      "key": "example/buildpack",
      "version": "5.0.1",
      "layers": {
        "dist": {
          "sha": "sha256:07a4155470875608306f01f6a4045aaff4f6f9abaa6cb9f96a9ef6b8bdb440a6",
          "data": {
            "artifact": {
              "version": "1.2.0",
              "url": "https://example.com/download/release/v1.2.0/component-v1.2.0-linux-arm64.tar.gz"
            }
          }
        }
      }
    }
  ]
}

// After patch (updated from patch-image)
{
  "buildpacks": [
    {
      "key": "example/buildpack",
      "version": "5.0.1",
      "layers": {
        "dist": {
          "sha": "sha256:1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
          "data": {
            "artifact": {
              "version": "1.2.3",
              "url": "https://example.com/download/release/v1.2.3/component-v1.2.3-linux-arm64.tar.gz"
            }
          }
        }
      }
    }
  ]
}
```

### Multi-Architecture Support
- **Architecture matching**: The `patch-image` can be a multi-architecture image manifest
- **Automatic selection**: The system will automatically select the image variant that matches the target image's OS/architecture
- **Missing architecture handling**: If no matching OS/arch variant exists in the `patch-image`, the patch is skipped with a warning
- **Image access failures**: If the entire `patch-image` cannot be found or accessed, the operation fails immediately

### Buildpack Patch Distribution
The generation and distribution of the patch file is out of scope for this RFC but because this feature will being as experimental we are documenting a possible path for community drive patches.

A buildpack author has a buildpack distributed as `ossuser/my-tini-buildpack`, we could consider allowing the user to define an upstream patch reference in `buildpack.toml` targets. A platform such as `pack` could find the relevant `buildpack.toml` files for the selected buildpacks and then merge the resulting patch files into for layer patching. This allows buildpacks from different ecosystems to be patched by the platform without them all needing to be in a shared builder.

```toml
[buildpack]
id = "ossuser/my-tini-buildpack"
version = "1.0"

# Targets the buildpack will work with
[[targets]]
os = "linux"
[layer-patch]
reference_uri = "github.com/ossuer-buildpack/releases/tini-patch.json"
```

# Migration
[migration]: #migration

## Backward Compatibility
- Existing images without buildpack layer metadata will continue to work with current rebase behavior
- Platform implementations can opt-in to enhanced rebase validation

## Migration Path
No breaking changes are introduced - existing rebase operations will continue to function as before.

# Drawbacks
[drawbacks]: #drawbacks

- **Increased complexity**: Additional metadata and validation logic increases implementation complexity
- **Performance overhead**: Layer analysis and validation may add time to rebase operations
- **Compatibility constraints**: Some base image updates may become impossible due to strict compatibility requirements
- **Single Layer**: This is intended to be a 1 to 1 layer replacement. You can't turn 1 layer into many layers or define a hard relationship between layers such that 2 layers get replaced in a single patch selector.
- **Packages**: This does not address being able to patch a vuln on a single `npm` package in a layer that `node_modules`.

# Alternatives
[alternatives]: #alternatives

## Alternative 1: Full Rebuild Requirement
- **Description**: Require full rebuilds when buildpack layers are present
- **Pros**: Simpler implementation, guaranteed compatibility
- **Cons**: Slower deployment of security updates, increased resource usage

## Alternative 2: Layer Annotation-Based Swapping
- **Description**: Use OCI image annotations to mark swappable layers without external metadata files
- **Pros**: Self-contained metadata, no external file dependencies
- **Cons**: Limited flexibility, harder to coordinate across multiple images

## Alternative 3: Buildpack-Managed Layer Updates
- **Description**: Allow buildpacks to define their own layer update mechanisms
- **Pros**: Maximum flexibility for buildpack authors
- **Cons**: Inconsistent interfaces, complex coordination between buildpacks

# Prior Art
[prior-art]: #prior-art

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
- **Sparse Images**: This is not directly related to this RFC, but `pack` can produce sparse images. `pack` doesn't appear to be able to `pack rebase --sparse`. We should consider closing this gap and understanding how this feature would intersect with sparse images.
- **Patch Distribution**: This RFC hasn't defined how the patch file(s) and images are expected to be distributed. We need a path that makes sense for Platform Operators as well as end users who only interact with `pack`.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

TODO
