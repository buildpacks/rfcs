# Meta
[meta]: #meta
- Name: Default command arguments and overrides
- Start Date: (fill in today's date: 2021-03-23)
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Buildpacks API currently doesn't provide a way to set a default set of arguments for the various process types that can be over-ridden by users. The current behaviour of the laucher is to [append the arguments](https://github.com/buildpacks/spec/blob/main/buildpack.md#launch) provided by the user to the existing list of arguments defined for a process type. The [OCI image spec](https://github.com/opencontainers/image-spec/blob/master/config.md#properties), [Docker](https://docs.docker.com/engine/reference/builder/#understand-how-cmd-and-entrypoint-interact) and [Kubernetes Container specification](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#notes) all have support for a construct to allow users to override default arguments. This proposal suggests a way we could achieve something for processes defined by the Buildpacks API. 

# Motivation
[motivation]: #motivation

- Why should we do this?

This addition would bring Buildpack API in parity with the OCI image spec and what is provided by Dockerfile. It would also enable use cases for overriding default arguments during runtime in the Kubernetes world. In order to achieve something like this, users have resolved to creating shims which implement this functionality. I believe that we could enable a lot more use cases out of the box without users having to implement it themselves.

- What use cases does it support?

  - Providing a default set of arguments
  - Over-riding these defaults

- What is the expected outcome?

The launcher should be able to determine if arguments have been passed by the user or not and if they have, it should override a default list of arguments by the once specified by the user.


# What it is
[what-it-is]: #what-it-is

The proposal involves adding an changing the `command` key to be a string array instead of a single string. This array would be the command and its associated arguments that would be set by default and any additional arguments passed by the user would be appended to it. The `args` array would refer to a set of default arguments that will be appened to the `command` array if no arguments are passed by the user during runtime.


```toml
[[processes]]
type = "<process type>"
command = ["command", "along", "with", "additional", "arguments"]
args = ["default", "arguments", "that", "can", "be", "overridden"]
direct = false
```

This would bring the definition of `command` and `args` to be consistent with the `Kubernetes` definition of the same. This table summarizes the field names used by Docker/OCI, Kubernetes, the current API and the proposed API.


| OCI/Docker   | Kubernetes | Proposed  | Current            |
| ------------ | ---------- | --------- | ------------------ |
| `ENTRYPOINT` | `command`  | `command` | `command` + `args` |
| `CMD`        | `args`     | `args`    | N/A                |


# How it Works
[how-it-works]: #how-it-works

Let's see how this proposal will work through an example. Let's say we have a process as defined below - 


```toml
[[processes]]
type = "hi"
command = ["echo", "Hello"]
args = ["World"]
direct = <direct>
```

If the user runs - 

```
docker run --entrypoint hi <image-name>
```

The above would translate to the behavior exhibited by the following process definition as per the current spec -

```toml
[[processes]]
type = "hi"
command = "echo"
args = ["Hello", "world"]
direct = <direct>
```

On the other hand if the user provides arguments by running something like - 

```
docker run --entrypoint hi <image-name> universe
```

The above would translate to the behavior exhibited by the following process definition as per the current spec -

```toml
[[processes]]
type = "hi"
command = "echo"
args = ["Hello", "universe"]
direct = <direct>
```

NOTE - The lifecycle should validate that `command` is indeed an array of strings instead of a single string and show a warning/error otherwise.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

This could potentitally cause confusion amongst existing Buildpack authors since the keys in the `launch.toml` remain the same but their meaning and behavior change drastically. However, this would be a one-time change and would make us consistent with other container ecosystems. 

# Alternatives
[alternatives]: #alternatives

The other alternative to support something like this involves adding an additional `additional_default_args` key in the `Launch Metadata` (launch.toml) that is a list of strings. This list of strings would be a set of additional arguments that would be appended to the existing command invocation if the user does not provide any arguments themselves.

Although this would be a backwards compatible change, this would be an even larger deviation from other container ecosystems and a possible point of confusion for new users in the future.

The above example would look like below if this alternative were to be followed - 

```toml
[[processes]]
type = "<process type>"
command = "<command>"
args = ["<arguments>"]
additional_default_args = ["<additional>", "<default>", "<arguments>"]
direct = <direct>
```

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

- [RFC #45](0045-launcher-arguments.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?

Should we go with the alternative proposal or should we make a backwards incompatible change for a possible improvement in user experience.

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes


The `command` and `args` key under the `[[process]]` array would change as described above.
