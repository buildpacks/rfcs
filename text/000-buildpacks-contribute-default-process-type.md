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

default process type - describes the process type that will be started by the launcher when the app image is run. It can be overriden by overriding the image entrypoint. Example: an image with default process type of web would have an entrypoint of `/cnb/process/web` which is a symlink that points to `/cnb/lifecycle/launcher`. The launcher uses argv0 to determine which process to start.

# Motivation
[motivation]: #motivation

- Why should we do this? Easier and more intuitive for end users.
- What use cases does it support? Apps with one or more process type(s).
- What is the expected outcome? The experience should be seamless for end users. Buildpacks should produce a sensible default process type without the user having to know or care that process types exist. The platform should still be able to override the default process type by passing `-process-type` to the lifecycle.

# What it is
[what-it-is]: #what-it-is

#### Happy path

Example: single process app with a buildpack declaring a process type of `web` with `default = true` -> the app image will have a default process type of `web`

Example: single process app with no buildpacks declaring `default = true` -> the app image will have no default process type. Users must specify the process to run at runtime. (This assumes https://github.com/buildpacks/spec/pull/137)

Example: single process app with no buildpacks declaring `default = true` and the user passes `-process-type worker` -> the app image will have a default process type of `worker`

Example: multi-process app with a buildpack declaring a process type of `web` with `default = true` and a later buildpack declaring a process type of `worker` (only) -> the app image will have a default process type of `web`

#### Overrides

Example: multi-process app with an earlier buildpack declaring a process type of `web` with `default = true` and a later buildpack declaring a process type of `worker` with `default = true` -> the app image will have a default process type of `worker`

Example: multi-process app with a buildpack declaring a process type of `web` with `default = true` and the user passes `-process-type worker` -> the app image will have a default process type of `worker`

#### Overrides - edge cases
[edge-cases]: #edge-cases

Example: multi-process app with an earlier buildpack declaring a process type of `web` with `default = true` and a later buildpack redefining what `web` means WITHOUT `default = true` -> the app image will have no default process. Users must specify the process to run at runtime. The lifecycle should print a warning.

Example: multi-process app with an earlier buildpack declaring a process type of `web` with `default = true` and a later buildpack redefining what `web` means WITH `default = true` -> the app image will have a default process type of `web`, with the later buildpack's definition of web.

- Define the target persona: buildpack author, buildpack user.

New buildpack users would need to be taught that buildpacks will be responsible for setting a sensible default process type. They should know how to override the buildpacks-provided default if they desire.

Existing buildpack users would need to be taught about the change so that (1) they no longer have to pass a flag to specify the default process type or (2) they now need to pass a flag to explicitly override the default that buildpacks choose. For (2), it's likely that the number of users in this category would be small given that the lifecycle (pre- platform API 0.4) and pack (post- platform API 0.4) both encourage `web` as the default, and it's likely that buildpacks would also encourage this same default.

Buildpack authors would need to be taught how to configure the default process type.

# How it Works
[how-it-works]: #how-it-works

The changes from this RFC should require a bump to the buildpack API.

Currently, during the `build` phase, buildpacks may declare process types by writing entries to `<layers>/launch.toml`. During the `export` phase, the `<layers>/launch.toml` from each buildpack are aggregated to produce a combined processes list "such that process types from later buildpacks override identical process types from earlier buildpacks" ([spec](https://github.com/buildpacks/spec/blob/main/buildpack.md#process-3)).

This RFC proposes a new `default` key in `<layers>/launch.toml`:

```
[[processes]]
type = "<process type>"
command = "<command to run>"
default = <boolean (default=false)>
```

Example:

```toml
[[processes]]
type = "web"
command = "bundle exec ruby app.rb"
default = true

[[processes]]
type = "worker"
command = "bundle exec ruby worker.rb"
```

Buildpacks may set `default = true` to indicate that the process type being defined should be the default process type for the app image. If not specified, no default designation will be assumed (to be consistent with buildpacks implementing earlier buildpack APIs).

If a buildpack attempts to define two processes with `default = true` specified, the lifecycle will fail.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

- Buildpacks could stomp on each other, each trying to declare different default process types. This might be confusing.
- Changing the way things work now could surprise some people.
- One more thing for buildpack authors to know and care about.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Keep things as they are.
  - Earlier iterations of this PR, including:

    * Having `default-process-type` be a top-level key in `<layers>/launch.toml`, as opposed to a field on each process.
    * Having a concept of `override` tied to either

        (a) each process type, such that process types specified by later buildpacks MAY override process types with the same name that were specified by earlier buildpacks, depending on the value of `override`

        (b) the default process type itself, such that a buildpack can indicate something like "make this the default process, but only if other buildpacks didn't specify a default process"

- Why is this proposal the best? Easier for end users! It simplifies the build process (need to provide one fewer flag, don't need to rebuild if process types are not known ahead of time).
- What is the impact of not doing this? A moderate amount of frustration.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

`pack build` has a `--default-process` flag. If this flag is not provided by the user, `pack` will provide `-process-type web` to the lifecycle. If `web` is not a valid process type, the lifecycle will warn and set the image entrypoint to `/cnb/lifecycle/launcher`, which will require the user to specify the desired process in the command when running the app image. This has the advantage of "just working" for web apps. However for non-web apps, the user must know what process types exist and pass the desired default explicitly when building the app, otherwise they will get an image that must be configured at runtime.

The lifecycle if not provided any `-process-type` will set the default process type to the only process type (if there is only one), otherwise it will warn and set the image entrypoint to `/cnb/lifecycle/launcher` as described above. This has the advantage of "just working" for single-process apps. However this requires the lifecycle to be "opinionated" and may be surprising for some users. See [spec PR](https://github.com/buildpacks/spec/pull/137) for the proposed removal of this behavior which should go hand-in-hand with this RFC.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should `pack` continue to pass `-process-type web`?

  Options discussed:

  A. `pack` stops sending `-process-type web` when `CNB_PLATFORM_API` is greater than `0.X`. The lifecycle will assume `default = true` for `web` processes from buildpacks implementing earlier buildpack APIs. The lifecycle could print a warning when buildpacks do not specify a process type. `-process-type <unknown process type>` could then become a failure case (vs. warn, what it is today).

    Pros:

    * Usage of `CNB_PLATFORM_API` will help smooth the transition for other platforms like Tekton.

    Cons:

    * We can't assume that buildpacks will set `default = true`. This could still lead to a prevalence of app images where the start command must be specified by the user at runtime.
    * The lifecycle's warnings could go unseen when `pack` is used in a CI system.

  B. We introduce a new flag, `-platform-process-type` which will be the default process type IF neither the user (via `-process-type`) nor buildpacks specify a default process type. `-platform-process-type <unknown process type>` would be a warn case, and `-process-type <unknown process type>` could then become a failure case.

    Pros:

    * This will preserve the existing behavior of `pack` i.e., always try to set `web` as the default process type - but in a way that doesn't stomp on the buildpacks-provided default process type

    Cons:

    * It could be trickier to create an image that doesn't have any default process type (users might want to do this). Potentially something like `pack build <app> --default-process none` could produce an app image without a default process type.

- What about buildpacks implementing different buildpack APIs that need to work together?
  - Assuming `default` if not specified means `default = false` is consistent with earlier buildpack API versions and will make things easier to reason about.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Does this RFC entail any proposed changes to the core specifications or extensions? New key in `<layers>/launch.toml`, logic to disambiguate multiple buildpacks specifying different default process types, consumption of the disambiguated default process type by the exporter.
