# Meta
[meta]: #meta
- Name: Set Image Working Directory to value of CNB_APP_DIR
- Start Date: 2021-01-13
- Author(s): @josegonzalez
- Status: Approved
- RFC Pull Request: [rfcs#134](https://github.com/buildpacks/rfcs/pull/134)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/spec#183](https://github.com/buildpacks/spec/issues/183), [buildpacks/lifecycle#516](https://github.com/buildpacks/lifecycle/issues/516), [buildpacks/docs#290](https://github.com/buildpacks/docs/issues/290)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes setting the Working Directory property of run images to the value of `CNB_APP_DIR`.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

This change will enable platforms to more easily introspect on the correct working directory for
exec'ing into a container without being tied to CNBs as the foundation for image building. Without
this change, platforms will need to special-case CNB images to ensure entering new or existing
containers is performed in the correct path.

By way of example, it is very easy to forget to specify the `launcher` as the entrypoint. Assuming a user
sets an entrypoint of `bash`:

```shell
# sample app setup
$ git clone https://github.com/buildpacks/samples
$ pack build sample-app --path apps/java-maven --builder cnbs/sample-builder:bionic

# bash as entrypoint, docker run
$ docker run --entrypoint bash -it sample-app
cnb@3e8152452126:/$ echo $PWD
/

# launcher as entrypoint, docker run
$ docker run --entrypoint launcher -it sample-app bash
cnb@d58a2c0003d8:/workspace$ echo $PWD
/workspace

# creating a launcher container
$ docker run --entrypoint launcher -d -it sample-app bash
e2b84e2e0182e7ec17b4b3f9054fcf5094d2fa7501e63a19fb433db5eb81ea4b

# entering the launcher container
$ docker exec -it e2b84e2e0182e7ec17b4b3f9054fcf5094d2fa7501e63a19fb433db5eb81ea4b bash
cnb@e2b84e2e0182:/$ echo $PWD
/

# creating a launcher container with the workdir option
$ docker run --entrypoint launcher -d --workdir /workspace -it sample-app bash
4cbdafe02f8af69cd790451e016d13ee51a70aff82fdefec9b16bdc0a4717f0b

# entering the launcher container
$ docker exec -it 4cbdafe02f8af69cd790451e016d13ee51a70aff82fdefec9b16bdc0a4717f0b bash
cnb@4cbdafe02f8a:/workspace$ echo $PWD
/workspace
```

Additionally, copying files from an image may be incorrect if the value is not introspected properly
for CNB images.

# What it is
[what-it-is]: #what-it-is

The proposes one change

- Injection of `/workspace` - the value of `CNB_APP_DIR` - as the WorkingDir of built images

# How it Works
[how-it-works]: #how-it-works

The `Exporter.Export()` would need to be modified to call `Image.SetWorkingDIr()` with the correct value.

# Drawbacks
[drawbacks]: #drawbacks

It is less code to do so.

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

- There would be a new property - `WorkingDir` - on exported images that was previously an empty string and will now contain the value of `CNB_APP_DIR`.
