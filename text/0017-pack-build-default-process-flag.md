# Meta
[meta]: #meta
- Name: Pack Build Default Process Flag
- Start Date: 2019-10-29
- Status: Implemented
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
$ pack build --default-process <process name> <image name>`
```

The `<process name>` must be a valid process name in `launch.toml`.

# How it Works
[how-it-works]: #how-it-works

When running `pack build --default-process <process name>` this will output a OCI Image where the `CNB_PROCESS_TYPE` is set to `<process name>`. This allows users to override the default process type at runtime by setting the environmant variable.  This will then be used by `/lifecycle/launcher` at runtime so it knows which process to run.

`<process name>` must be a valid process name in the process table by running the buildpacks. If the process can not be found, then `pack build` will return an error code failing the build.

# Drawbacks
[drawbacks]: #drawbacks

This adds another flag to an already crowded list of flags available for `pack build`. Once `project.toml` lands, `pack` users will have another way to do this.

`CNB_PROCESS_TYPE` is a CNB spcific thing, so it may not be obvious to users when inspecting the image.

# Alternatives
[alternatives]: #alternatives

- `pack build --default-process` sets `Cmd` in the OCI Image. Though this may be more intuitive to non CNB users, but processes are a CNB concept so it may not make sense as a `Cmd`. This also does not require us to change the precedence relationship between `CNB_PROCESS_TYPE` and `Cmd`. If `Cmd` is set, setting `CNB_PROCESS_TYPE` will do nothing.
- Wait for `project.toml`
- Use `Dockerfile` or other container tooling to override the `Cmd` field in the OCI image

# Prior Art
[prior-art]: #prior-art

- `Dockerfile` lets you set `Cmd`.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
