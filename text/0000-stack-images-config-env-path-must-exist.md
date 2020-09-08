# Meta
[meta]: #meta
- Name: Build/Run image configs MUST contain env.PATH
- Start Date: 2020-08-21
- Author(s): @aemengo @ameyer-pivotal @mvalliath @TisVictress @micahyoung
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Windows build & run stack images need to set a `PATH` environment variable in the image config to avoid Docker's alternative mechanism for env var `PATH`-loading from the Windows registry, which typically contains the value of `PATH` for Windows images. Relying on the Windows registry creates inconsistency between Windows and Linux CNB mechanisms which causes Windows app images to be unrunnable in some circumstances [lifecycle#384](https://github.com/buildpacks/lifecycle/issues/384).

I propose we change the spec to codify the current de-facto Linux image behavior -- to require a complete `config.Env.PATH` to be set on all build & run stack images, for Windows or Linux. When a `config.Env.PATH` is set on a Windows image, they will always behave like Linux images and avoid triggering Docker's Windows registry-based loading of the `PATH` environment variable. Linux stack images get additional validation but generally will never need to change because they already have a `PATH` set from the base image.

See [spec-changes](#spec-changes-optional) for details.

# Definitions
[definitions]: #definitions
* [Windows registry](https://en.wikipedia.org/wiki/Windows_Registry): Very common key-value store for Windows OS, used to store environment variable values among other things
* *Windows registry hives delta*: Files stored in each OCI image layer, containing Windows registry values that are aggregated and exposed to processes in a running container. The format is not documented by Docker but is [bcd-formatted](https://en.wikipedia.org/wiki/Windows_NT_6_startup_process#Boot_Configuration_Data).

# Motivation
[motivation]: #motivation

- Why should we do this?
    - Fix [lifecycle#384](https://github.com/buildpacks/lifecycle/issues/384) 
    - Make Windows and Linux images load CNB-required env var data consistently from the same place: `config.Env`
    - Using two sources of data for Windows `PATH` env var would be confusing
    - Reading Windows registry-`PATH` directly from the image would require parsing and aggregating Windows registry `Hives/*_delta` files from layers, which are undocumented nor guaranteed stable
    - Still allows other env var values to come either `config.Env` or from the Windows registry 
    - Windows stack authors can set this once, with low effort
    - Validation tooling can expose the correct value from the runtime environment
    - No effort for Linux stack authors, and no backward compatibility concerns as all existing images must have had a `config.Env.PATH` set to function.

- What use cases does it support?
    - Stack authors using their build and/or run images with a platform (i.e. `pack create-builder`)
- What is the expected outcome?
    - Any Windows or Linux build run images missing a `config.Env.PATH` which would cause the platform to fail with error message.

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
    - N/A, similar image env vars are already spec'd in platforms 
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
    - Stack Authors
- Explaining the feature largely in terms of examples.
    - As a Stack Author making a stack image from scratch: 
      - Create a Windows stack image from a new `Dockerfile` without a `PATH`
      - Attempt to use the stack image with their platform (i.e. `pack create-builder`)
      - See a failure
      - Add a `ENV PATH C:\\Windows\\System32;C:\\stack-specific-dir`
      - Re-attempt to use the image
      - See no failure
    - As a Stack Author making a stack image from samples:
      - Copy existing sample stack (which already contains `ENV PATH C:\\Windows\\System32`)
      - Attempt to use the stack image with their platform (i.e. `pack create-builder`)
      - See no failure
      - Add stack-image specific directory to `PATH`: `ENV PATH C:\\Windows\\System32;C:\\stack-specific-dir`
      - Attempt to use the stack image with their platform (i.e. `pack create-builder`)
      - See no failure
      
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
    - Sample error message (based on existng `pack` error message):
    > ERROR: failed to create builder: invalid build-image: adding image labels to builder: image cnbs/sample-stack-build:nanoserver-1809 missing required env var PATH
- If applicable, describe the differences between teaching this to existing users and new users.
    - This is best taught along-side other required platform env vars.

# How it Works
[how-it-works]: #how-it-works

The spec changes are minimal: change `platform.md` to always require run images and build images to have a `config.Env` entry for `PATH`. It is also valid to set to empty `PATH=` for stack images that do not want to use a `PATH`. If `config.Env.PATH` were unset, a platform would fail.

This change relies on the current behavior of Docker and containerd for Windows is to set each container runtime env var from only one of two places in the image: preferring `config.Env` variables that are set, then falling back to values set in the Windows registry hive layer data. Docker's behavior is intended to align with Windows conventions of apps setting all environment variables through the Windows registry but still allowing for `config.Env` to override them.

Windows base images de-facto always leave the `config.Env.PATH` unset so that Docker will load the env var `PATH` (an any other unset env vars) from the Windows registry. 

```
$ crane config mcr.microsoft.com/windows/nanoserver:1809-amd64 | jq '.config.Env'
null

$ docker run mcr.microsoft.com/windows/nanoserver:1809-amd64 cmd /c echo %PATH%
C:\Windows\system32;C:\Windows;   # From the registry hives value
```

On the other hand, Linux base images - and build & run stack images by inheritance - de-facto always set `config.Env.PATH` to `/usr/bin:/bin:<etc≥` because there is no alternative mechanism for setting the initial env var `PATH`.

```
$ crane config alpine | jq '.config.Env'
[
  "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
]

$ crane config cnbs/sample-stack-run:alpine | jq '.config.Env'
[
  "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  "CNB_USER_ID=1000",
  "CNB_GROUP_ID=1001"
]

$ docker run alpine sh -c 'echo $PATH'
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

$ docker run cnbs/sample-stack-run:alpine sh -c 'echo $PATH'
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

The difference in Windows and Linux base image conventions carry-through to the respective run images which results in Windows apps images with incomplete `config.Env.PATH`, containing only lifecycle CNB paths (i.e. `c:\cnb\process`). Docker never attempts to load the Windows registry `PATH` value since it prefers the `config.Env.PATH`. 

Platforms would ensure that `config.Env.PATH` is set on a build or run image configs, just like they do `config.Labels` and other `config.Env` values (ex `CNB_USER_ID`).

Stack authors would set `config.Env.PATH` to the complete value they need for the image (perhaps just the shell's `PATH`), either by adding `ENV PATH=...` to their stack image Dockerfiles or directly setting in the image config with the equivalent of `config.Env += ["PATH=..."]` for their build and run images to pass validation. They would choose an empty path with `config.Env = ["PATH="]`.

In practice (not spec'd), the `config.Env.PATH` will typically contain, at minimum, a path to the directory of the shell. Also, if unset, the platform could fail with a helpful error message, perhaps how to set a `config.Env.PATH` and perhaps how to find a recommended value: `docker run <base image> cmd /c echo %PATH%` or something similar.

The result of all this is that once a `config.Env.PATH` is set, Docker Windows (and containerd) will never attempt to load the `PATH` value from the registry, even with `config.Env.PATH=`. This ensures consistent behavior lifecycle and app image containers, for Windows and Linux -- that the runtime value for `PATH` is always `config.Env.PATH`, and if a command is needed, a Stack Author can add it to the `config.Env.PATH`.

# Drawbacks
[drawbacks]: #drawbacks

* Stack Authors may be surprised that stack images require `config.Env.PATH`, whereas typical Windows base images do not. 
  * This can be mitigated with appropriate _platform_ error messaging when it is unset.
* Stack Authors will not be able to use the Windows-specific workaround syntax for Dockerfile `PATH` augmentation (i.e. `setx PATH %PATH%;c:\mystuff`). They'll always need to provide the full value.
  * I feel this is not a major concern, as Docker's workarounds are not documented and are problematic in the first place. Docker itself only documents setting the entire env vars through `ENV PATH=...`.
* Stack Authors will need to correctly duplicate their Windows registry value of `PATH`, which may lead to accidental mis-matches. 
  * No good option for mitigation but some possibilities considered: 
      * Change _lifecycle_ or _launcher_ to compare the running container's `PATH` with the Windows registry value. A warning message could be given to the user, but it could not be fatal since only a Stack Author could not fix the issue.
      * Change platforms to attempt to read an image's `Hives/*_Delta`, though the format is undocumented and potentially unstable and the value would need to be aggregated from every layer and hive delta file.
      * Change platforms to create a one-off container that would return Docker's runtime value of `PATH`.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - An [alternative approach](https://github.com/buildpacks/lifecycle/commit/c72ec4be2646add815c4731133fe55c6998055cf) I tried was to change _lifecycle_ and _launcher_ to always merge the runtime env var `PATH` (from `config.Env.PATH`) and the Windows registry `PATH` values before running subprocesses but it was somewhat complex, led to very platform-specific differences, and didn't handle the `PATH` for `ENTRYPOINT`s (before `lifecycle` was run).
  - Reading a the `PATH` directly from an image's `Hives/*_Delta` files, whose format is undocumented and potentially unstable, is not feasible. If the value could retrieved, it would still need to be aggregated across all hives and layers.
- Why is this proposal the best?
  - It unifies Linux and Windows env var behavior while still allowing Windows env vars to come from either an image's `config.Env` or the Windows registry.
  - It allows for Docker to come up with a better Dockerfile solution to augment `config.Env` vars, similar to Linux.
  - It imposes only a one-time, minor burden on Stack Authors.
- What is the impact of not doing this?
  - Lifecycle will continue to generate unrunnable app images.

# Prior Art
[prior-art]: #prior-art

Docker's abandoned attempt at Dockerfile-based `PATH` augmentaton: 
* Initial PR: https://github.com/moby/moby/pull/29048 
* End of discussion: https://github.com/moby/buildkit/issues/74

Another abandoned Dockerfile `ENV` approach: [`ENV --lazy-expand`](https://github.com/moby/moby/pull/31525)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - Should the spec require `PATH` to contain at least the shell?
- What parts of the design do you expect to be resolved through implementation of the feature?
  - Implementers would provide helpful error messages to end users, much like other spec'd env vars 
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - Changing lifecycle on Windows to validate the runtime values of env vars contain the Windows registry values (when Stack Authors mis-matched the `confiv.Env.PATH` values and the Windows registry `PATH` value)
  
# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Proposed spec diff: https://github.com/buildpacks/spec/compare/main...micahyoung:spec-stack-images-config-env-path-must-exist
