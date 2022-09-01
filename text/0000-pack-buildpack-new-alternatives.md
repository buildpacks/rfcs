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

We will implement the project scaffolding logic in a Go module separate from `pack`.  This decouples `pack` from the project scaffolding implementation.

# Definitions
[definitions]: #definitions

* **project scaffolding**: minimal code and file system structure used to start a project.

# Motivation
[motivation]: #motivation

The creation of buildpacks in languages other than `bash` is undocumented in the [Buildpack Author Guide](https://buildpacks.io/docs/buildpack-author-guide).  In particular, creating a buildpack in Go using `libcnb` is undocumented because there is no mechanism to generate a scaffolded project.  This proposal adds a mechanism to `pack` that would allow the buildpacks project to provide `libcnb` buildpack project scaffolding.

`pack buildpack create` supports end-users who wish to scaffold a new buildpack.  The operation of `pack buildpack create` requires Internet access to succeed.  `pack buildpack create --template URL` allows projects (such as Paketo, Heroku and others) to define skeleton projects for new buildpacks.

Replacing `pack buildpack new` with `pack buildpack create` allows buildpack authors to more-easily create new buildpacks in their chosen language and framework.

# What it is
[what-it-is]: #what-it-is

Project scaffolding is [very](https://cookiecutter.readthedocs.io/) [popular](https://yeoman.io/) [in](https://github.com/kowainik/summoner) [other](https://crates.io/crates/cargo-scaffold) [ecosystems](https://github.com/golang-standards/project-layout).  Scaffolding systems are employed to ease onboarding of new developers.  Within `pack` this feature is targeted at onboarding buildpack authors.

`pack buildpack create` creates the same buildpack scaffolding as `pack buildpack new`.  However, `pack buildpack create --template URL` can be used to access alternative project scaffolding.

# How it Works
[how-it-works]: #how-it-works

The design is modeled on [cookiecutter](https://cookiecutter.readthedocs.io/en/1.7.2/) with reference to [springerle](https://github.com/carlmjohnson/springerle) -- a similar implementation in golang -- and [create-go-app](https://github.com/create-go-app/).  We do not want to `os.Exec` a python subprocess to run cookiecutter as this would require availability of a python runtime environment.  Instead we propose to borrow heavily from create-go-app, and generate the default shell scaffolding from a cloned git repoistory.

The `pack buildpack new` project scaffolding accepts `--api`, `--path` and `--stacks` command line flags and the buildpack id as a positional argument.  These command line flags and positional arguments will be replaced with user prompts `pack buildpack create`.

A full session includes the terminal prompts that the project scaffolding tool asks of the end user:

```command
$ pack buildpack create
✔ Enter an ID for this buildpack: example/bash
✔ Enter a directory in which to scaffold the project: bash_buildpack
Use the arrow keys to navigate: ↓ ↑ → ←
? Choose the buildpack API version (use the default if you are unsure):
  ▸ 0.7
    0.8
✔ Enter a stack this buildpack will support by default: io.buildpacks.samples.stacks.bionic

Created project in bash_buildpack
```

The user can skip prompts by providing `--arg key=value` as command line flags. Each of the prompts from the previous interactive invocation can be skipped by providing appropriate pairs of key and value.

```command
$ pack buildpack create --arg ProjectDirectory=bash_buildpack --arg BuildpackApi=0.8 --arg BuildpackID=example/bash --arg BuildpakStacks=io.buildpacks.samples.stacks.bionic

Created project in bash_buildpack
```

Templates are provided as a file tree.  A root-level `prompts.toml` file contains prompts for the end-user.  For example the current `bash` scaffolding could be structured as follows, a full specification of `prompts.toml` is provided in the following subsection.

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

A specification of `prompts.toml` is provided below.

Multiple templates can be managed in a single repository, referred to as a **template colleciton**.

## Template Collections

We expect project templates to be managed in `git` repositories.  Projects may wish to manage multiple templates in a single repository.  We refer to this as a template collection.  More formally, a template collection is a `git` repository where top-level directories are templates.  A template collection does not contain a top-level `prompts.toml`, but top-level subdirectories are expected to contain `prompts.toml` files.  As an example, a template collection might have the following structure where the `bash` sub-directory is a template and the `Go` sub-directory is a template.

```bash
.
├── bash
└── Go
```

A user may use a template collection as an argument to `--template`.  A template collection passed as `--template` first prompts the end user to choose between the available templates in the repository.  Once a template is chosen, the user is prompted using the `prompts.toml` from the chosen template.

```command
$ pack buildpack create --template https://github.com/AidanDelaney/cnb-buildpack-templates
Use the arrow keys to navigate: ↓ ↑ → ←
? choose a project template:
  ▸ Go
    bash
Enter a directory in which to scaffold the project: go_buildpack
? Choose the buildpack API version (use the default if you are unsure):
    0.7
  ▸ 0.8
✔ 0.8
Enter an identifier for the buildpack: example/golang
Enter a stack this buildpack will support by default: io.buildpacks.samples.stacks.bionic
✔ Enter a valid Go module name for this buildpack: github.com/user/buildpack
Created project in go_buildpack
```

A user may specify the choice of template from a template collection via a `--sub-path` flag.  A user may choose a `bash` template from a template collection and provide the api, output directory and stacks as command line flags:

```command
$ pack buildpack create --template https://github.com/AidanDelaney/cnb-buildpack-templates \
  --sub-path Go \
  --arg BuildpackID=example/golang \
  --arg BuildpackAPI=0.8 \
  --arg ProjectDirectory=go_buildpack \
  --arg BuildpackStacks=io.buildpacks.samples.stacks.bionic
Created project in go_buildpack
```

Having provided examples of the use of `pack buildpack create`.  We now specify the format of `prompts.toml`.

## prompts.toml

The prompts are contained in a TOML file.  The `prompts.toml` file contains an array of tables.  Each table specifies a single `prompt`.  Each prompt defines a variable identified by a provided `name`.

| field         | required | description                                                                                                                              | type           |
|---------------|----------|------------------------------------------------------------------------------------------------------------------------------------------|----------------|
| name          | Yes      | The variable identifier.  Must be unique within the `prompts.toml` file.                                                                 | string         |
| prompt        | Yes      | The default prompt question to ask the user                                                                                              | string         |
| prompt.locale | No       | A translation of the default prompt into the locale specified.                                                                           |                |
| required      | No       | Evaluates to `false` if not provided.  Specifies whether the user **must** provide a value for the variable identified by `name`.        | boolean        |
| default       | No       | A default value for the variable identified by `name`.  Mutually exclusive to `choices`                                                  | string         |
| choices       | No       | A list of default values from which the user may choose a value for the variable identified by `name`.  Mutually exclusive to `default`. | list of stings |

Prompt locales are specified following [IETF BCP 47](https://tools.ietf.org/rfc/bcp/bcp47.txt).  As such `prompt.en-US` is the translation of `prompt` into US English and `prompt.es-MX` is the translation of `prompt` into Mexican Spanish.

For example, the following is a valid `prompts.toml` file:

```toml
[[prompt]]
name="ProjectDirectory"
prompt="Enter a directory in which to scaffold the project"
```

The following `prompts.toml` is invalid as it does not contain the required `name` field:

```toml
[[prompt]]
prompt="Enter a directory in which to scaffold the project"
```

The following `prompts.toml` is invalid as value of the `name` field is not unique within the document:

```toml
[[prompt]]
name="ProjectDirectory"
prompt="Enter a directory in which to scaffold the project"

[[prompt]]
name="ProjectDirectory"
prompt="Enter a directory"
```

The following `prompts.toml` is invalid as the `default` and `choices` fields are mutually exclusive:

```toml
[[prompt]]
name="ProjectDirectory"
prompt="Enter a directory in which to scaffold the project"
default="/tmp"
choices=["/tmp", "/home"]
```

## Arguments

Arguments may be provided as command line arguments.  For example `pack buildpack create --arg ProjectDirectory=/tmp` provides a value, `/tmp`, for the variable identified by the name `ProjectDirectory`.

When an argument, `key=value`, is provided then `pack buildpack create` must not prompt the user with the prompt identified by `name=key`.

Where an `--arg key=value` is provided and no prompt identified by `name=key` exists in `prompts.toml`, then the provided argument is ignored.

Choices constrain values for a given variable.  Where a provided `value` does not match one of the `choices` then an error is returned.   That is to say, given

```
[[prompt]]
name="BuildpackApi"
prompt="Choose the buildpack API version (use the default if you are unsure)"
choices=["0.7", "0.8"]
```

and given a CLI invocation `pack buildpack create --arg BuildpackApi=0.6` the choices are restricted to `["0.7", "0.8"]`.  Therefore, `0.6` is an invalid argument and an error is returned to the end-user.

## `pack buildpack create` Substitutions

The operation of variable substitution follows the operation of Go [`text/template`](https://pkg.go.dev/text/template).  Prompts defined in `prompts.toml` are interpreted, the user may be prompted and set of variables is generated.  The identifiers of variables are replaced with the value of the variable.

Variables may be used in files, for example where a `prompts.toml` defines a variable with identifier `ProjectDirectory` then the expression `{{.ProjectDirectory}}` in files is replaced with the value of the variable identified by `ProjectDirectory`.  In addition, the expression `{{.ProjectDirectory}}` may be used in template file paths.  The generated project substitutes file paths with variable expressions with the value of the variable.

When a source file contains a Go `text/template` style expression and the variable name does not appear in `prompts.toml`, then the `text/template` style expression is not replaced.  For example, if a `README.md` file contains the expression `{{.Example}}` and `Example` is not a variable defined in `prompts.toml`, then the string `{{.Example}}` is not replaced in `README.md`.

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
* What team maintains template repositories?
  * Buildpack Author Tooling team

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This proposal does not require any spec changes.
