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

The proposal essentially involves adding an additional `additional_default_args` key in the `Launch Metadata` (launch.toml) that is a list of strings. This list of strings would be a set of additional arguments that would be appended to the existing command invocation if the user does not provide any arguments themselves.

```toml
[[processes]]
type = "<process type>"
command = "<command>"
args = ["<arguments>"]
additional_default_args = ["<additional>", "<default>", "<arguments>"]
direct = false
```

# How it Works
[how-it-works]: #how-it-works

Let's see how this proposal will work through an example. Let's say we have a process as defined below - 


```toml
[[processes]]
type = "hi"
command = "echo"
args = ["Hello"]
additional_default_args = ["world"]
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

This way we can preserve the current behaviour of appending user-provided arguments and remain backwards compatible, while at the same allowing a way to provide a set of additional default arguments that can be over-ridden by the user.


# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

N/A

# Alternatives
[alternatives]: #alternatives

The other alternative to support something like this is to change `command` from a string to an array of strings specifying the command and the additional arguments it will always be run with and `args` to become a set of default arguments that can be over-ridden by the user.

Although this would be a backwards incompatible change, this would be more in-line with with concepts that other tools like `Kubernetes` and `Docker` support. This would like help new users relate the above fields to concepts they are familiar with and avoid confusion.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

- [RFC #45](0045-launcher-arguments.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?

Should we go with the alternative proposal and make a backwards incompatible change for a possible improvement in user experience.

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

A new `launch.toml` field under the `[[process]]` array called `additional_default_args`.
