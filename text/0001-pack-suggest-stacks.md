# Meta
[meta]: #meta
- Name: Suggest Stacks
- Start Date: 2019-04-25
- CNB Pull Request: [rfcs#4](https://github.com/buildpacks/rfcs/pull/4), [pack#190](https://github.com/buildpacks/pack/pull/190)
- CNB Issue: [pack#156](https://github.com/buildpacks/pack/issues/156)
- Supersedes: N/A

# Summary
[summary]: #summary

A `suggest-stacks` command will be added to the `pack` CLI help buildpack authors discover stacks. The output of this command will include the `io.buildpacks.stack.bionic` stack (maintained by the Cloud Native Buildpacks project) and other stacks that are popular within the community.

# Motivation
[motivation]: #motivation

### Case 1: Buildpack author providing a buildpack to the community
Given that buildpack authors must explicitly list supported stack in the buildpack's `buildpack.toml`, a buildpack author that hopes to provide a buildpack for comsuption by the community (an APM vendor for example) will want to know what stacks they should consider supporting.

### Case 2: Buildpack author creating a builder image
A buildpack author who wishes to create a builder but who does not want to create or maintain a stack should be able to easily find a maintained stack to use. `pack` and our documentation currently provides no guidance here. This is evidenced by questions from users in github and slack who are struggling to fill out the `stack` section of `builder.toml` with appropriate values. Making stacks discoverable in pack should significantly improve this experience.


# What it is
[what-it-is]: #what-it-is

`pack suggest-stacks` command will provide information about the bionic stack and community stacks. At the moment the bionic stack does not have run image mirrors. However, mirrors are included in the example output below, to demonstrate how they would be incorporated if we chose to maintain mirrors of the bionic run image.

```
$ pack suggest-stacks

Stacks maintained by the Cloud Native Buildpacks project:

    Stack ID: io.buildpacks.stacks.bionic
    Maintainer: Cloud Native Buildpacks
    Desciption: Minimal bionic images
    Build Image: packs/build
    Run Image: packs/run
    Run Image Mirrors:
        gcr.io/packs/run
        buildpacksio.azurecr.io/packs/run

Stacks maintained by the community:

    Stack ID: heroku-18
    Maintainer: Heroku
    Desctipion: (TO BE PROVIDED BY HEROKU)
    Build Image: heroku/pack:18-build
    Run Image: heroku/pack:18

    Stack ID: org.cloudfoundry.stacks.cflinuxfs3
    Maintainer: Cloud Foundry
    Desctipion: (TO BE PROVIDED BY CLOUD FOUNDRY)
    Build Image: cfbuildpacks/cflinuxfs3-cnb-experimental:build
    Run Image: cfbuildpacks/cflinuxfs3-cnb-experimental:run
```
Note: the run-image-mirrors above are an example of how mirrors would be displayed if we maintained them, not references to mirrors that currently exist.

Other stacks can be add to the list of community stacks upon request from the maintainer, if it can be demonstrated that the images can be trusted by the community and the images will be actively patched with CVE fixes.

# How it Works
[how-it-works]: #how-it-works

`pack` prints hard coded strings. Additions to the list can be PR'd into `pack`.

# Drawbacks
[drawbacks]: #drawbacks

* We will need to establish criteria for vetting new editions to the list
* Adding `pack *-stack(s)` commands may inadvertantly encourage users to create new stacks (we believe there should be many more stack authors than buildpack authors. Consuming a maintained stack is the easiest and safest options in most circumstances)

# Alternatives
[alternatives]: #alternatives

As an alternative apporach, documentation could be used to improve stack discoverability. I hypothesize that building the discoverability into `pack` will make this information more easily accessible compared with documentation (many users will explore `pack --help` when they have a question, only resorting to documentation when necessary).

If we do not solve this problem users will continue to struggle to use the `create-builder` command correctly, and therefore be unable to take advantage of one of the powerful features of `pack`.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is providing run image mirrors valuable or unnecessary?
-