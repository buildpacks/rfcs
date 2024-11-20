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

Allow users to provide additional volumes that can be exported similar to the application directory and allow easy configuration of the application directory. These volumes are defined via the `buildpack.exportable-volumes` by each buildpack.

# Definitions
[definitions]: #definitions

- `exportable-volumes`: A set of volumes describing where the buildpack process is likely to write data specific and should be exported alongside the application workspace.

# Motivation
[motivation]: #motivation

The main motivation behind this RFC is to unlock exporting application images that require libraries or software to be installed in certain directories apart from the default application directory and these installations are rebase safe and self-contained. This unlocks use cases where buildpacks may install software in `/opt` directories (for AWS Lambda extensions or other common standalone software) for example or preserve some settings in a `/home/$USER/.config` for the output application. This provides a rebase safe extension point without major changes to the buildpacks API.

# What it is
[what-it-is]: #what-it-is

Buildpack authors would be able to buildpacks with `buildpack.exportable-volumes` keys in their `buildpack.toml` files.

For example a a buildpack may look like -

```toml
api = "<buildpack API version>"

[buildpack]
id = "<buildpack ID>"
name = "<buildpack name>"
exportable-volumes = ["aws-extensions", "user-config-dir"]
```

The above would only be valid for normal buildpacks and not meta-buildpacks. Based on the `exportable-volumes` field, a platform would be responsible for validating that the `build` and `run` image do not have any content on these paths. By default these volume names will map to `/workspaces/<exportable-volume-name>` but a user may specify a label `io.buildpacks.exportable-volumes` on the `build` image to map a volume name to a different location. This label would look like -

```json
[
    {"name": "user-config-dir", "value": "/home/cnb/.config"},
    {"name": "aws-extensions", "value": "/opt"}
]
```

For volumes defined by buildpacks but not in the `io.buildpacks.exportable-volumes` we will use a default `/workspaces/<exportable-volume-name>` directory.

# How it Works
[how-it-works]: #how-it-works

This RFC would require changes to the lifecycle and platform API.

The lifecycle would be responsible for creating symlinks from `/workspaces/<exportable-volume-name>` in the build image to the actual mapped directory and make these writable for buildpacks. It will also be responsible for exporting the content on these directories to the actual paths on the run-image.

The current default workspace directory would be moved to `/workspaces/default` but the lifecycle will symlink that directory back to `/workspace` for backwards compatibility.

# Drawbacks
[drawbacks]: #drawbacks

- Additional complexity

# Alternatives
[alternatives]: #alternatives

N/A
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