# Meta
[meta]: #meta
- Name: Pack Buildpack New to Support Alternatives
- Start Date: 2022-03-10
- Author(s): aidandelaney
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
The `pack buildpack new` subcommand creates a new buildpack based on a shell-script template.  This proposal extends `pack buildpack new` with a `--libcnb` option and a `--template URL` option to allow alternatives to the shell-script template.  The `--libcnb` option creates a new buildpack written in golang using `libcnb`.  The `--template URL` option allows buildpack creation from an arbitrary 3rd party URL.

# Definitions
[definitions]: #definitions

* **project scaffolding**: minimal code and file system structure used to start a project.

# Motivation
[motivation]: #motivation

The creation of buildpacks in languages other than `bash` is undocumented in the [Buildpack Author Guide](https://buildpacks.io/docs/buildpack-author-guide).  In particular, creating a buildpack using `libcnb` is undocumented because there is no mechanism to generate a scaffolded project.  This proposal adds a minimal `libcnb` project template to `pack` and allows 3d parties to provide templates to create buildpacks for their chosen technology stack.

Extending `pack buildpack new` with a `--libcnb` flag supports buildpack creation using the existing documented workflow.  This results easier on-boarding of buildpack authors into the `libcnb` ecosystem.  Additionally extending `pack buildpack new` with `--target URL` allows other projects to re-use `pack` as their scaffolding tool.

`pack buildpack new --libcnb` supports end-users who wish to scaffold a new `libcnb`-based buildpack.  The operation of `pack buildpack new --libcnb` does not require internet access to succeed.  `pack buildpack new --template URL` allows projects (such as Paketo, Heroku and others) to define skeleton projects for new buildpacks.

Extending `pack buildpack new` allows buildpack authors to more-easily create new buildpacks in their chosen language and framework.

# What it is
[what-it-is]: #what-it-is

Project scaffolding is [very](https://cookiecutter.readthedocs.io/) [popular](https://yeoman.io/) [in](https://github.com/kowainik/summoner) [other](https://crates.io/crates/cargo-scaffold) [ecosystems](https://github.com/golang-standards/project-layout).  Scaffolding systems are employed to ease onboarding of new developers.  Within `pack` this feature is targeted at onboarding buildpack authors.

- Explaining the feature largely in terms of examples.

`pack buildpack new --libcnb` should generate skeleton code according to the [golang standard project layout](https://github.com/golang-standards/project-layout) and include `libcnb` best practices.  The layout would look similar to the following:

```bash
.
├── buildpack.toml
├── cmd
│   └── main.go
├── go.mod
├── go.sum
└── pkg
    ├── build.go
    └── detect.go
```

This approach is not opinionated on topics such as which testing framework to use.  Only components under github.com/buildpacks/* are used in the `--libcnb` skeleton.  `pack buildpack new --template URL` allows for more opinionated project scaffolding.  As such, we support new buildpack authors with `--libcnb` onboarding and support experienced buildpack authors to use the scaffolding of their choice.

# How it Works
[how-it-works]: #how-it-works

The design is modeled on [cookiecutter](https://cookiecutter.readthedocs.io/en/1.7.2/) with reference to [springerle](https://github.com/carlmjohnson/springerle) -- a similar implementation in golang -- and [create-go-app](https://github.com/create-go-app/).  We explicitly do not want to re-implement cookiecutter in golang due to the scope of such an implementation.  Nor do we want to `os.Exec` a python subprocess to run cookiecutter as this would require availability of a python runtime environment.  Instead we propose to borrow heavily from create-go-app, and generate the default shell and libcnb skeletons from an embedded file system.

A full invocation to generate `libcnb` scaffolding is similar to the [documented project scaffolding](https://buildpacks.io/docs/buildpack-author-guide/create-buildpack/building-blocks-cnb/#using-the-pack-cli).

```bash
pack buildpack new --libcnb examples/ruby \
    --api 0.7 \
    --path ruby-buildpack \
    --version 0.0.1 \
    --stacks io.buildpacks.samples.stacks.bionic
```

A full session includes the terminal prompts that the project scaffolding tool asks of the end user:

```bash
pack buildpack new --libcnb examples/ruby \
    --api 0.7 \
    --path ruby-buildpack \
    --version 0.0.1 \
    --stacks io.buildpacks.samples.stacks.bionic
Package name (often github.com/username/repo)? github.com/AidanDelaney/ruby
Created project in ruby-buildpack
```

Templates are provided as a file tree.  A root-level `prompts.yaml` file contains prompts for the end-user.  For example, a partial file tree containing user prompts and golang skeleton code is:

```bash
.
├── prompts.yaml
├── cmd
    └── main.go
```

Where `prompts.yaml` is of the form:

```yaml
prompts:
    - variable: packageName
      prompt: Package name (often github.com/username/repo)
```

And an example templated source file is:

```golang
package main

import (
	"github.com/buildpacks/libcnb"

	bp "{{ .packageName }}/pkg"
)

func main() {
	libcnb.Main(
		bp.Detect{},
		bp.Build{},
	)
}
```

The following template variables, known as the _reserved template variables_ are available for substitution in all project files:

* `.ID` -- the buildpack id that will be written to `buildpack.toml` obtained from a positional argument to `pack`
* `.Version` -- the buildpack version obtained from the argument to the `--version` flag
* `.API` -- the buildpack API version obtained from the argument to the `--api` flag
* `.Stacks` -- a slice containing the buildpack stacks obtained from the argument to the `--stacks` flag

Template variables introduced in `prompts.yaml` are required to have a name unique within the `prompts.yaml` file and not redefine reserved template variables.  An optional default value may be provided.  Variables that do not provide a default value must 

```yaml
prompts:
    - variable: packageName
      prompt: Package name (often github.com/username/repo)
      default: DefaultValue
```

Answers to prompts can be provided in a yaml file.  This supports programmatic use of `pack`:

```
pack buildpack new --libcnb examples/ruby \
    --config-file answers.yaml \
    --api 0.7 \
    --path ruby-buildpack \
    --version 0.0.1 \
    --stacks io.buildpacks.samples.stacks.bionic
Created project in ruby-buildpack
```

The format of `--config-file` parallels the format used in `cookiecutter`.  An example of which is:

```yaml
defaultContext:
    packageName: com.example/an-example
```

All input files are expected to be normalized to Unix line endings.

# Migration
[migration]: #migration

The current `bash` project scaffolding can be embedded in `pack` as an embedded file system.  This would allow the `--libcnb` and `--target URL` code to be reused.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

* Golang project structure is straightforward and it could be better to document a `libcnb` project structure.  However, given that we already support `pack builpack new`, we feel it important that `pack` also creates generation of `libcnb`-style projects.
* Project scaffolding could be delegated to a 3rd party tool.  The current `pack buildpack new` functionality could be extracted from `pack` and, instead, we could suggest another tool for end users to use for project scaffolding eg: `bare use buildpaks/bash my_buildpack`.
* Including `--libcnb` project scaffolding in `pack` will increase size of `pack` binary.  The size of `pack` will increase by the size of the embedded file system plus the size of an appropriate prompting package (such as [survey](https://pkg.go.dev/github.com/AlecAivazis/survey/v2)) and an appropriate package allowing `git clone` (such as [go-git](https://github.com/go-git/go-git) at ).  The `pack` binary will grow to 
* This proposal commits to support a specific project scaffolding format.  A migration path should be established if and when a de-facto standard golang template library becomes available.
* In supporting `--libcnb` we cannot be opinionated about test frameworks; this will result in scaffolded projects with no default test setup.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We have considered a wider re-implementation of [cookiecutter](https://cookiecutter.readthedocs.io/).  However, the scope of a re-implementation was considered too wide.  In addition, we have considered a cookiecutter-lite implementation where project scaffolding is cloned from a repository.  This proposal recommends a project scaffolding that can be embedded in `pack` and, in addition, can be downloaded from an Internet source.

We have also considered [springerle](https://github.com/carlmjohnson/springerle) which uses a single txtar file to describe skeleton project structure.  The use of a single txtar file requires template providers to write and maintain this format.

[bare](https://github.com/bare-cli/bare) is a new project.  It assumes that all templates are stored on github.com.

- Why is this proposal the best?
To integrate with `pack` we want a pure-golang project scaffolding tool.  This proposal advocates an approach that embeds cnb-provided skeletons in `pack` and allows `pack` to clone 3rd party skeletons from a location chosen by the end-user.

- What is the impact of not doing this?

Omitting support for `libcnb` project scaffolding requires new buildpack authors to consult our documentation about project structure.  Moreover, as `pack` supports scaffolding of shell-script buildpacks the impression is given that the buildpacks project _prefers_ shell implementations.

# Prior Art
[prior-art]: #prior-art

There are many, many competing implementations of project scaffolding tools.

* Python's [Cookiecutter](https://cookiecutter.readthedocs.io/): widely used to scaffold projects in many languages, including golang.  Requires a Python runtime to be available.
* [springerle](https://github.com/carlmjohnson/springerle): golang re-think of cookiecutter.  Springerle uses a single txtar file augmented with a header containing user prompts.  This proposal prefers using a filesystem rather than a single txtar file as the filesystem approach extends to cloning repositories.
* [cgapp](https://github.com/create-go-app/cli): This proposal heavily borrows from cgapp.  It is necessary to modify parts of cgapp in order to apply variable substitution.
* JavaScript's [Yeoman](https://yeoman.io/): widely used in the web ecosystem
* [boilr](https://github.com/tmrts/boilr/): golang cookiecutter.  Moribund project.
* [bare](https://github.com/bare-cli/bare): golang cookiecutter. Possible successor to boilr.  Both boilr and bare assume the templates are stored on github.com and use the zip downloading functionality of that specific service.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This proposal does not require any spec changes.
