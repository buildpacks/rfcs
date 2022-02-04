# Meta
[meta]: #meta
- Name: Add Visual Pack Build
- Start Date: 2020-05-14
- Author(s): aemengo
- Status: Approved
- RFC Pull Request: [rfcs#160](https://github.com/buildpacks/rfcs/pull/160)
- CNB Pull Request: (leave blank)
- CNB Issue: [pack#1200](https://github.com/buildpacks/pack/issues/1200), [pack#1201](https://github.com/buildpacks/pack/issues/1201), [pack#1203](https://github.com/buildpacks/pack/issues/1203), [pack#1204](https://github.com/buildpacks/pack/issues/1204), [pack#1205](https://github.com/buildpacks/pack/issues/1205), [pack#1206](https://github.com/buildpacks/pack/issues/1206)
- Supersedes: https://github.com/buildpacks/rfcs/pull/152

# Summary
[summary]: #summary

Pack should provide a visual representation of the image build process. Please see [mockup](https://storage.googleapis.com/artifacts.cf-garden-windows-dev.appspot.com/pack-build-visual.mp4) for concept.

# Definitions
[definitions]: #definitions

* [Pack](https://github.com/buildpacks/pack) - A tool within the buildpacks ecosystem for converting code into runnable images, in a local environment.

# Motivation
[motivation]: #motivation

The **casual application developer** has trouble seeing the value proposition of buildpacks. They also encounter a high learning curve when using our tooling. We've seen evidence of this through user interviews and other channels.

For most of these developers, pack is their introduction to the buildpacks ecosystem. By providing a visual representation of the build process, they will be introduced to various buildpack concepts, and their relevance to the build process. 

# What it is
[what-it-is]: #what-it-is

When a casual application developer runs `pack build [--interactive/-i]` on the command-line in the working directory of their application, they are presented with a terminal UI that depicts the build process. The command will depict the build process as four stages.

1. The [pull stage](https://user-images.githubusercontent.com/4236888/119383740-b9e4ee00-bc91-11eb-9a02-c0267b568763.png)
2. The [detect stage](https://user-images.githubusercontent.com/4236888/119383770-bfdacf00-bc91-11eb-82ce-49b95d82c938.png)
3. The [build stage](https://user-images.githubusercontent.com/4236888/119383765-be110b80-bc91-11eb-8877-ab10fbd7cad6.png)
4. The [result stage](https://user-images.githubusercontent.com/4236888/119383754-bc474800-bc91-11eb-924e-91bb30d78820.png)

---

This RFC acts as a gateway to subsequent functionality. Follow-up RFCs could include:

1. **CVE detection.** A user should be able to view CVEs that a **(r) rebase** will remove.
1. **Build Hijack.** A user should be able to open a shell for debugging, into a failed build container.
1. **Edit Build Plan.** A user should be able to modify a build plan, before building.  
1. **Export Build Plan.** A user should be able to "save" a modified build plan, for reproducibility.
1. **View Layer Details.** A user should be able to view a filesystem diff by a plan "step" à la [dive](https://github.com/wagoodman/dive).
1. **Revert Plan.** A user should be able to revert to last successful build plan. 
1. **Even More.**

# How it Works
[how-it-works]: #how-it-works

One can make extensive use of [rivo/tview](github.com/rivo/tview) to provide a UI, and handle user events, on the command-line. In Golang.

# Drawbacks
[drawbacks]: #drawbacks

- This RFC would increase maintenance cost and surface area. It provides a whole net new path that will need to be tested and maintained.

# Alternatives
[alternatives]: #alternatives

- Find other means to entice the casual application developer into the buildpacks ecosystem.

# Prior Art
[prior-art]: #prior-art

- [Mockup](https://storage.googleapis.com/artifacts.cf-garden-windows-dev.appspot.com/pack-build-visual.mp4)
- [Mockup Src](https://github.com/aemengo/pack-visualize)
- [Hijack Issue](https://github.com/buildpacks/pack/issues/62)
- [Layer Metadata Issue](https://github.com/buildpacks/lifecycle/issues/411)

# Issues to Create

- buildpacks/pack: `pack build -i` prompts you to choose from suggested builders [epic/pack-build-interact]
- buildpacks/pack: `pack build -i` conducts pull phase [epic/pack-build-interact]
- buildpacks/pack: `pack build -i` conducts detect phase [epic/pack-build-interact]
- buildpacks/pack: `pack build -i` shows interactive panel with **image:**, **builder:** info [good first issue][epic/pack-build-interact]
- buildpacks/pack: `pack build -i` shows interactive panel with **plan:** info [epic/pack-build-interact]
- buildpacks/pack: `pack build -i` shows interactive panel with **log:** info [epic/pack-build-interact]
