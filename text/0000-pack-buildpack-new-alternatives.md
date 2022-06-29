# Meta
[meta]: #meta
- Name: Pack Buildpack New to Support Alternatives
- Start Date: 2022-03-10
- Author(s): aidandelaney
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: https://github.com/buildpacks/rfcs/blob/main/text/0077-pack-buildpack-create.md

# Summary
The `pack buildpack new` subcommand creates a new buildpack based on a shell-script template.  This proposal replaces `pack buildpack new` with `pack buildpack create` to allow alternatives to the shell-script template.  Invoking `pack buildpack create` creates a new buildpack using the existing `bash` scaffolding.  The `--template URL` option allows buildpack creation from an arbitrary 3rd party URL.

We will implement the project scaffolding logic in a Go module separate from `pack`.

# Definitions
[definitions]: #definitions

* **project scaffolding**: minimal code and file system structure used to start a project.

# Motivation
[motivation]: #motivation

The creation of buildpacks in languages other than `bash` is undocumented in the [Buildpack Author Guide](https://buildpacks.io/docs/buildpack-author-guide).  In particular, creating a buildpack in Go using `libcnb` is undocumented because there is no mechanism to generate a scaffolded project.  This proposal adds a mechanism to `pack` that would allow the buildpacks project to provide `libcnb` buildpack project scaffolding.

`pack buildpack create` supports end-users who wish to scaffold a new bash buildpack.  The operation of `pack buildpack create` requires Internet access to succeed.  `pack buildpack create --template URL` allows projects (such as Paketo, Heroku and others) to define skeleton projects for new buildpacks.

Replacing `pack buildpack new` with `pack buildpack create` allows buildpack authors to more-easily create new buildpacks in their chosen language and framework.

# What it is
[what-it-is]: #what-it-is

Project scaffolding is [very](https://cookiecutter.readthedocs.io/) [popular](https://yeoman.io/) [in](https://github.com/kowainik/summoner) [other](https://crates.io/crates/cargo-scaffold) [ecosystems](https://github.com/golang-standards/project-layout).  Scaffolding systems are employed to ease onboarding of new developers.  Within `pack` this feature is targeted at onboarding buildpack authors.

`pack buildpack create` creates the same buildpack scaffolding as `pack buildpack new`.  However, `pack buildpack create --template URL` can be used to access alternative project scaffolding.

# How it Works
[how-it-works]: #how-it-works

The design is modeled on [cookiecutter](https://cookiecutter.readthedocs.io/en/1.7.2/) with reference to [springerle](https://github.com/carlmjohnson/springerle) -- a similar implementation in golang -- and [create-go-app](https://github.com/create-go-app/).  We do not want to `os.Exec` a python subprocess to run cookiecutter as this would require availability of a python runtime environment.  Instead we propose to borrow heavily from create-go-app, and generate the default shell scaffolding from a cloned git repoistory.

The `pack buildpack new` project scaffolding accepts `--api`, `--path` and `--stacks` command line flags.  These command line flags will be preserved in `pack buildpack create`.  However, where a flag is omitted, the end-user will be prompted to provide an appropriate value.

A full session includes the terminal prompts that the project scaffolding tool asks of the end user:

```bash
pack buildpack create example/bash
✔ Enter a directory in which to scaffold the project: bash_buildpack
Use the arrow keys to navigate: ↓ ↑ → ←
? Choose the buildpack API version (use the default if you are unsure):
  ▸ 0.7
    0.8
✔ Enter a stack this buildpack will support by default: io.buildpacks.samples.stacks.bionic

Created project in bash_buildpack
```

Templates are provided as a file tree.  A root-level `prompts.toml` file contains prompts for the end-user.  For example the current `bash` scaffolding would be structured as.:

```bash
.
├── prompts.toml
└── {{.ProjectDirectory}}
    └── bin
        ├── build
        └── detect
```

Where `prompts.toml` is of the form:

```toml
[[prompt]]
name="ProjectDirectory"
prompt="Enter a directory in which to scaffold the project"
default="bash_buildpack"
required=true

[[prompt]]
name="BuildpackApi"
prompt="Choose the buildpack API version (use the default if you are unsure)"
choices=["0.7", "0.8"]

...
```

Template variables introduced in `prompts.yaml` are required to have a name unique within the `prompts.yaml` file.  An optional default value may be provided.

Answers to prompts can be provided in a toml file.  This supports programmatic use of `pack`.  Alternatively, variables specified in `prompts.toml` may have values provided as command line flags.  When an override is provided in the CLI or `overrides.toml` file, then the end-user is not prompted to provide the value.

```
pack buildpack create --override 'ProjectDirectory="test_example"' --override='BuildpackApi=0.8'
✔ Enter a stack this buildpack will support by default: io.buildpacks.samples.stacks.bionic
Created project in bash_buildpack
```

The above overrides are equivalent to:

```
pack buildpack create --path test_example --api 0.8
✔ Enter a stack this buildpack will support by default: io.buildpacks.samples.stacks.bionic
Created project in bash_buildpack
```

All input files are expected to be normalized to Unix line endings.

# Migration
[migration]: #migration

The current `bash` project scaffolding can be re-used in the default project scaffolding.

We intend to maintain `pack buildpack new` in parallel with `pack buildpack create` for two `pack` releases.  After two `pack` releases, `pack buildpack new` will be replaced with an error instructing the user to run `pack buildpack create`.  We will remove `pack buildpack new` after three `pack` releases.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

* Project structure is straightforward and it could be better to document a `libcnb` project structure.  However, given that we already support `pack builpack new`, we feel it important that `pack` also creates generation of `libcnb`-style projects.
* Project scaffolding could be delegated to a 3rd party tool.  The current `pack buildpack new` functionality could be extracted from `pack` and, instead, we could suggest another tool for end users to use for project scaffolding eg: `bare use buildpacks/bash my_buildpack`.
* Including generalized project scaffolding in `pack` will increase size of `pack` binary.  The size of `pack` will increase by the size of an appropriate prompting package (such as [survey](https://pkg.go.dev/github.com/AlecAivazis/survey/v2)) and an appropriate package allowing `git clone` (such as [go-git](https://github.com/go-git/go-git) at ).
* This proposal commits to support a specific project scaffolding format.  A migration path should be established if and when a de-facto standard golang template library becomes available.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We have also considered [springerle](https://github.com/carlmjohnson/springerle) which uses a single txtar file to describe skeleton project structure.  The use of a single txtar file requires template providers to write and maintain this format.

[bare](https://github.com/bare-cli/bare) is a new project.  It assumes that all templates are stored on github.com.

- Why is this proposal the best?
To integrate with `pack` we want a pure-golang project scaffolding tool.  This proposal advocates an approach that integrates future cnb-provided project scaffolding with `pack` and allows `pack` to clone 3rd party project scaffolding from a location chosen by the end-user.

- What is the impact of not doing this?

Omitting support for generalized project scaffolding requires new buildpack authors to consult our documentation about project structure.  Moreover, as `pack` supports scaffolding of shell-script buildpacks the impression is given that the buildpacks project _prefers_ shell implementations.

# Prior Art
[prior-art]: #prior-art

There are many, many competing implementations of project scaffolding tools.

* Python's [Cookiecutter](https://cookiecutter.readthedocs.io/): widely used to scaffold projects in many languages, including golang.  Requires a Python runtime to be available.
* [springerle](https://github.com/carlmjohnson/springerle): golang re-think of cookiecutter.  Springerle uses a single txtar file augmented with a header containing user prompts.  This proposal prefers using a filesystem rather than a single txtar file as the filesystem approach extends to cloning repositories.
* [cgapp](https://github.com/create-go-app/cli): This proposal heavily borrows from cgapp.
* JavaScript's [Yeoman](https://yeoman.io/): widely used in the web ecosystem
* [boilr](https://github.com/tmrts/boilr/): golang cookiecutter.  Moribund project.
* [bare](https://github.com/bare-cli/bare): golang cookiecutter. Possible successor to boilr.  Both boilr and bare assume the templates are stored on github.com and use the zip downloading functionality of that specific service.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This proposal does not require any spec changes.
