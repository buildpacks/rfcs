# Meta
[meta]: #meta
- Name: Launcher in Run Image
- Start Date: 2026-04-15
- Author(s): Hemant28codes
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

RFC: Launcher in Run Image

This RFC proposes a mechanism to allow the launcher binary to be provided by the run image instead of being unconditionally injected by the lifecycle's exporter phase. By introducing a specific flag, the exporter can be instructed to replace the standard launcher binary with a symlink in the "Buildpacks Application Launcher" layer, pointing to a path in the run image. This ensures that the application image structure remains consistent while decoupling the launcher's lifecycle from the application build.
# Definitions
[definitions]: #definitions

- Launcher: The binary that acts as the container entrypoint, responsible for setting up the environment and executing the application process.
- Exporter: The lifecycle phase responsible for creating the final application image, which currently adds a launcher layer unconditionally.
- Run Image: The base image used for the final application container.
- CNB_LAUNCHER_PATH: The path where the platform expects the launcher to reside (e.g., /cnb/lifecycle/launcher).

# Motivation
[motivation]: #motivation

Why should we do this? Currently, the exporter phase replaces any existing file or symlink at the launcher path with a new file-based layer, preventing platforms from providing their own launcher in the base image.

What use cases does it support?
- Security Patching via Rebase: This is a critical driver for the proposal. By making the launcher part of the run image, platforms can update the launcher to patch vulnerabilities (e.g., Go CVEs reported by security scanners in the binary) simply by updating the run image and performing a rebase. This eliminates the need to trigger a full build for thousands of applications just to update a shared launcher binary.
- Customized Launchers: Platforms that require specialized or environment-specific launcher logic can bake it directly into their base image infrastructure.

What is the expected outcome? Platforms can opt-out of the automatic launcher installation, ensuring that the launcher binary is managed as a run-time dependency that can be updated independently of the application build lifecycle.

# What it is
[what-it-is]: #what-it-is

This feature allows a platform to signal that the run image already contains a valid launcher.

- Target Persona: Platform implementors and operators.
- Example: A platform builds a run image with a symlink at /cnb/lifecycle/launcher pointing to a platform-specific binary. During the export phase, the platform passes a flag to skip the launcher installation, preserving the existing symlink.


# How it Works
[how-it-works]: #how-it-works

A new flag (e.g., --launcher-in-run-image) will be added to the exporter phase.

### Layer Preservation
The "Buildpacks Application Launcher" layer must always be present in the application image to maintain OCI artifact compatibility. The difference lies in whether this layer contains the binary itself or a symlink.

| Feature | Before (Current) | After (Proposed) |
| :--- | :--- | :--- |
| **Launcher Path** | `/cnb/lifecycle/launcher` | `/cnb/lifecycle/launcher` |
| **Content Type** | Self-contained executable (~2.8 MB) | Symlink to run image path |
| **Dependency** | None (Independent layer) | Explicit dependency on Run Image layer |

### Rebaser Responsibilities
With symlink-based launchers, the rebaser gains a new validation duty. It must verify that the target run image actually contains a valid launcher binary at the expected path. Failure to do so would result in a broken application at runtime.

#### Metadata Changes
The `io.buildpacks.lifecycle.metadata` label will be updated to include:
*   `launcher.type`: "binary" or "symlink"
*   `launcher.target`: The absolute path in the run image (only if type is symlink).

#### Run Image Advertising
Run images that provide a launcher should advertise this capability via a label:
`io.buildpacks.run.launcher.path=/usr/local/bin/launcher`


Just to give an idea of what our usecase is:

- Current Setup
Source code + Builder(contains lifecycle) -----(Build)----> Application image(contains launcher from lifecycle in builder + run image)

- Proposed Setup
Source code + Builder(contains lifecycle) -----(Build)----> Application image(contains run image), Run image -> will have launcher installed

# Migration
[migration]: #migration

This change requires a Platform API spec update, as the current spec mandates that the exporter install the launcher.

- Platform Developers: Will need to update their implementations to support and pass the new flag when appropriate.
- Compatibility: Since this is an opt-in flag, existing platforms and images will continue to function as they do today by default.

# Drawbacks
[drawbacks]: #drawbacks

- Validation Risk: If the flag is set but the run image does not actually contain a valid launcher, the resulting application image will fail at runtime.
- Complexity: Adds a conditional path to the exporter's image construction logic.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should the exporter perform a check to verify the existence of the launcher at CNB_LAUNCHER_PATH before completing the export?
- What should the exact naming of the flag be to ensure clarity across different platform implementations?
- Can we have a custom launcher or do we need to depend on the launcher provided by buildpacks, or maybe add on top of the buildpacks launcher?
- Will the launcher going to be a seperate binary which doesn't depend on spec - buildpack API, platform API, lifecycle version, libcnb version and will be decoupled from these?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
The Platform API specification must be updated to include the new flag and define the behavior where the launcher binary layer is skipped if the platform asserts its presence in the run image.

# History
[history]: #history

- 2026-04-15: Initial draft proposed by Hemant Goyal based on community discussion.
- 2026-04-20: Updated based on RFC discussions.
