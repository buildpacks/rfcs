# Meta
[meta]: #meta
- Name: Additional exportable layers
- Start Date: 2021-08-13
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow users to provide additional paths that can be exported similar to the application directory and allow easy configuration of the application directory. These paths are defined via the `buildpack.export_dirs` by each buildpack.

# Definitions
[definitions]: #definitions

- `export_dirs`: A set of directories describing where the buildpack process is likely to write data specific and should be exported alongside the application workspace. 

# Motivation
[motivation]: #motivation

The main motivation behind this RFC is to unlock exporting application images that require libraries or software to be installed in certain directories apart from the default application directory and these installations are rebase safe and self-contained. This unlocks use cases where buildpacks may install software in `/opt` directories (for AWS Lambda extensions or other common standalone software) for example or preserve some settings in a `/home/$USER/.config` for the output application. This provides a rebase safe extension point without major changes to the buildpacks API.

# What it is
[what-it-is]: #what-it-is

Buildpack authors would be able to buildpacks with `buildpack.export_dirs` keys in their `buildpack.toml` files.

For example a a buildpack may look like - 

```toml
api = "<buildpack API version>"

[buildpack]
id = "<buildpack ID>"
name = "<buildpack name>"
export_dirs = ["/opt", "/home/cnb/.config"]
```

The above would only be valid for normal buildpacks and not meta-buildpacks. Based on the `volumes` field, a platform would be responsible for validating that the `build` and `run` image do not have any content on these paths. Additionally, the builder image would be tagged with a label `io.buildpacks.export_dirs` with the list of paths that need to be exported. 

# How it Works
[how-it-works]: #how-it-works

This RFC would require changes to the lifecycle and platform API.

The platform would be responsible for mounting appropriate volumes based on the `io.buildpacks.export_dirs` label in the OCI image config. For a platform like `pack` which relies on a daemon this should be fairly straight-forward to achieve. For other platforms like `kpack` this would involve inspecting the builder image beforehand and modifying the build pod spec to accommodate the specified volumes.

The lifecycle changes would involve exporting the files present in the above locations which should be similar to the logic that currently exists for exporting application workspace. Buildpacks could also take advantage of `slices` to specify paths in these additional directories that should exist as separate layers.

The lifecycle `analysis` phase would also be responsible for validating that the above list of `export_dirs` is valid for the provided `run` image.

# Drawbacks
[drawbacks]: #drawbacks

- Additional complexity
- Platforms like Tekton may not be able to implement something like this easily.

# Alternatives
[alternatives]: #alternatives

TBD: Multiple App Directories proposal

# Prior Art
[prior-art]: #prior-art

- [RFC 72](https://github.com/buildpacks/rfcs/blob/main/text/0072-image-workdir.md)
- [RFC PR #172](https://github.com/buildpacks/rfcs/pull/172)
- [RFC PR #173](https://github.com/buildpacks/rfcs/pull/173)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

TBD.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

As noted above.