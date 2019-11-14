# Meta
[meta]: #meta
- Name: Pack Build Process Flag
- Start Date: 2019-10-29
- CNB Pull Request: [rfcs#28](https://github.com/buildpack/rfcs/pull/28)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This provides the ability for pack to change the default process in the exported image using a flag to `pack build`.

# Motivation
[motivation]: #motivation

`pack build` today does not set a `CMD` field in the OCI image. The buildpack sets the default process to launch by setting the `web` process type. It's easy to change which command to run on the fly by passing an argument to `/lifecycle/launcher`, the user has no way to change the default process in the OCI image that is built without resorting to other container tooling. The reason someone may want to do this is when distributing an image, the receiver or platform can just boot the container without any other config.

In addition, this feature aligns with some of the functionality being exposed by [Simple Project Descriptor RFC](https://github.com/buildpack/rfcs/pull/25).

# What it is
[what-it-is]: #what-it-is

This proposes adding a new flag to `pack build` that will change the default process type in the built image:

```
$ pack build --process <process name> <image name>`
```

The `<process name>` must be a valid process name provided by the buildpacks.

# How it Works
[how-it-works]: #how-it-works

When running `pack build --process <process name>` this will output a OCI Image where `Cmd` is set to the argument to be passed `/lifecycle/launcher`. This when when booting the image, the lifecycle knows which process to run.

`<process name>` must be a valid process name in the process table by running the buildpacks. If the process can not be found, then `pack build` will return an error code failing the build.

# Drawbacks
[drawbacks]: #drawbacks

This adds another flag to an already crowded list of flags available for `pack build`. Once `project.toml` lands, `pack` users will have another way to do this.

# Alternatives
[alternatives]: #alternatives

- Wait for `project.toml`
- Use `Dockerfile` or other container tooling to override the `Cmd` field in the OCI image

# Prior Art
[prior-art]: #prior-art

- `Dockerfile` lets you set `Cmd`.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
