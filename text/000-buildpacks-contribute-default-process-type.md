# Meta
[meta]: #meta
- Name: Buildpacks should be able to define the default process type for an app
- Start Date: 8/20/20
- Author(s): natalieparellano
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: n/a

# Summary
[summary]: #summary

Today, if a buildpacks user would like to define the default process type for their app, they need to pass `-process-type` to the exporter. This is cumbersome because a user might not know which process types are available until after the build has completed. Additionally, [this spec PR](https://github.com/buildpacks/spec/pull/137) would force some users who are currently relying on the lifecycle to specify the default process type to pass `-process-type` instead. This RFC proposes that buildpacks should be able to define the default process type for an app, while retaining the ability for a user to specify the desired default.

# Definitions
[definitions]: #definitions

launcher - a [lifecycle binary](https://github.com/buildpacks/spec/blob/main/platform.md#launcher) that is responsible for starting app processes. An app image built with CNBs will have the launcher's path (or a symlink to it) as its [entrypoint](https://github.com/opencontainers/image-spec/blob/master/config.md#properties).

process type - a CNB construct representing a process that can be started by the launcher. A process type has the following properties as described [here](https://github.com/buildpacks/spec/blob/main/buildpack.md#launchtoml-toml): type (string), command (string), arguments (array of string), direct (boolean). Buildpacks declare process types during the `build` phase by writing entries into `<layers>/launch.toml`.

default process type - describes the process that will be started by the launcher when the app image is run. It can be overriden by overriding the image entrypoint. Example: an image with default process type of web would have an entrypoint of `/cnb/process/web` which is a symlink that points to `/cnb/lifecycle/launcher`. The launcher uses argv0 to determine which process to start.

# Motivation
[motivation]: #motivation

- Why should we do this? Easier and more intuitive for end users.
- What use cases does it support? Apps with one or more process type(s).
- What is the expected outcome? The experience should be seamless for end users. Buildpacks should produce a sensible default process type without the user having to know or care that process types exist. The user should still be able to override the default process type by passing `-process-type` to the lifecycle.

# What it is
[what-it-is]: #what-it-is

Example: single process app with a buildpack declaring a `default-process` of type `web` -> the app image will have a default process type of `web`

Example single process app with no buildpacks declaring a `default-process` -> the app image will have no default process. Users must specify the process to run at runtime. (This assumes https://github.com/buildpacks/spec/pull/137)

Example: multi-process app with a buildpack declaring a `default-process` of type `web` -> the app image will have a default process type of `web`

Example: multi-process app with an earlier buildpack declaring a `default-process` of type `web` and a later buildpack declaring a process of type `worker` -> the app image will have a default process type of `worker`

Example: multi-process app with a buildpack declaring a `default-process` of type `web` and the user passes `-process-type worker` -> the app image will have a default process type of `worker`

Example: single process app with no buildpacks declaring a `default-process` and the user passes `-process-type worker` -> the app image will have a default process type of `worker`

- Define the target persona: buildpack author, buildpack user.

New buildpack users would need to be taught that buildpacks will be responsible for setting a sensible default process type. They should know how to override the buildpacks-provided default if they desire.

Existing buildpack users would need to be taught about the change so that (1) they no longer have to pass a flag to specify the default process type or (2) they now need to pass a flag to explicitly override the default that buildpacks choose. For (2), it's likely that the number of users in this category would be small given that the lifecycle (pre- platform API 0.4) and pack (post- platform API 0.4) both encourage `web` as the default, and it's likely that buildpacks would also encourage this same default.

Buildpack authors would need to be taught how to configure the default process type.

# How it Works
[how-it-works]: #how-it-works

The changes from this RFC should require a bump to the buildpack API.

Currently, during the `build` phase, buildpacks may declare process types by writing entries to `<layers>/launch.toml`. This RFC proposes a new key in `<layers>/launch.toml`, `[default-process]`, that specifies what each buildpack would like to designate as the default process type for the app image.

```toml
[default-process]
type = web

[[processes]]
type = web
command = bundle exec ruby app.rb

[[processes]]
type = worker
command = bundle exec ruby worker.rb
```

Currently, during the `export` phase, the `<layers>/launch.toml` from each buildpack are aggregated to produce a combined processes list "such that process types from later buildpacks override identical process types from earlier buildpacks" ([spec](https://github.com/buildpacks/spec/blob/main/buildpack.md#process-3)). In line with the existing philosophy, this RFC proposes that the `default-process` type from later buildpacks should override any `default-process` types from earlier buildpacks.

The exporter would continue to use the `-process-type` flag if provided to set the default process type for the app image. If no `-process-type` flag is provided, the exporter would use the `default-process` type provided by buildpacks.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Buildpacks could stomp on each other, each trying to declare different default process types. This might be confusing.
- Changing the way things work now could surprise some people.
- One more thing for buildpack authors to know and care about.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered? Keep things as they are.
- Why is this proposal the best? Easier for end users! It simplifies the build process (need to provide one fewer flag, don't need to rebuild if process types are not known ahead of time).
- What is the impact of not doing this? A moderate amount of frustration.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

`pack build` has a `--default-process` flag. If this flag is not provided by the user, `pack` will provide `-process-type web` to the lifecycle. If `web` is not a valid process type, the lifecycle will warn and set the image entrypoint to `/cnb/lifecycle/launcher`, which will require the user to specify the desired process in the command when running the app image. This has the advantage of "just working" for web apps. However for non-web apps, the user must know what process types exist and pass the desired default explicitly when building the app, otherwise they will get an image that must be configured at runtime.

The lifecycle if not provided any `-process-type` will set the default process type to the only process type (if there is only one), otherwise it will warn and set the image entrypoint to `/cnb/lifecycle/launcher` as described above. This has the advantage of "just working" for single-process apps. However for multi-process apps, the challenges are the same as described above. See [spec PR](https://github.com/buildpacks/spec/pull/137) for the proposed removal of this behavior which should go hand-in-hand with this RFC.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should `pack` continue to pass `-process-type web`? It could inspect the buildpack API and only pass the flag if the API version is below 0.X. 
- What about buildpacks implementing different buildpack APIs that need to work together?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Does this RFC entail any proposed changes to the core specifications or extensions? New `default-process` key in `<layers>/launch.toml`, logic to disambiguate multiple buildpacks specifying different default process types, consumption of the disambiguated key by the exporter.
