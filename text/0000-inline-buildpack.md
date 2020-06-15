# Meta
[meta]: #meta
- Name: Inline Buildpacks
- Start Date: 2020-06-11
- Author(s): [Joe Kutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a type of buildpack that can be defined in the same repo as the app it is used with.

# Motivation
[motivation]: #motivation

One characteristic of `Dockerfile` that Buildpacks do not replace well is the ability to create a single, one-off file to quickly define a custom build process for an app or project. A `Dockerfile` may contain just a few lines of code, and a developer can generate a complete image. The only quick way to create a custom build for an app using a buildpack is by creating no fewer than three files: `buildpack.toml`, `bin/build`, and `bin/detect` (and likely storing those in a new repo).

We seek to reduce the barrier to entry for buildpacks when a developer needs to quickly create a custom, one-off build step by introducing a new mechanism that will allow a buildpack to be defined inline with an app (and with fewer files).

# What it is
[what-it-is]: #what-it-is

- **inline** - existing in the same repository

The target personas for this RFC are the buildpack author and buildpack user who need to create a custom, one-off build or are just getting started with buildpacks and do not want the overhead of a new repo.

We propose two new keys in the `[[build.buildpacks]]` table in `project.toml`:

- `inline` - a script that will be run as the `bin/build` of the inline buildpack
- `shell` - defines the shebang line of the script in `inline`

(Note: there is no need to implement `bin/detect`. The detect phase will always pass because there's no foreseeable reason that a user would create an inline buildpack that they don't want to use)

# How it Works
[how-it-works]: #how-it-works

When an entry in the `[[build.buildpacks]]` table contains an `inline` value, the platform WILL NOT attempt to download the buildpack `id@version`. Instead, it will create an ephemeral buildpack, with the following:

- a `bin/detect` that always passes (i.e. `exit 0`)
- a `bin/build` that contains the value of `inline` script without any changes (i.e. no magic)
- a `buildpack.toml` using the `id` and `version` from the buildpack entry in `project.toml`

When the emphemeral buildpack is executed, its working directory will contain the artifacts in the app repo. In this way, an `inline` script MAY reference other scripts in the repo. For example, a `lib/utils.sh` may be sourced by an inline Bash script.

## Example

The following `project.toml` creates a buildpack that will run two Rake tasks after running JVM and Ruby buildpacks.

```toml
[project]
id = "my-app"

[[build.buildpacks]]
id = "example/jvm"
version = "1.0"

[[build.buildpacks]]
id = "example/ruby"
version = "1.0"

[[build.buildpacks]]
id = "me/rake-tasks"
inline = """
  rake war
  rake db:migrate
"""
```

# Drawbacks
[drawbacks]: #drawbacks

- It discourages buildpack reuse (i.e. if it's really easy to create a one-off buildpack, people are less like to make reuseable buildpacks and share them)
- It encourages the copy-paste problems created by `Dockerfile`

# Alternatives
[alternatives]: #alternatives

- https://github.com/buildpacks/rfcs/pull/17
- [Packfile](https://github.com/sclevine/packfile/)

# Prior Art
[prior-art]: #prior-art

- `Dockerfile`
- [Packfile](https://github.com/sclevine/packfile/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Can an inline buildpack be published to a registry?
- Can inline buildpacks be root buildpacks?
- Can a `project.toml` contain more than one inline buildpack?
- Should `version` be required or should it default to `0.0.0`?
- How will platforms implement this behavior?
    - A future `/lifecycle/prepare` could generate the temporary buildpack from the inline script.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The [Project Descriptor extension](https://github.com/buildpacks/spec/blob/master/extensions/project-descriptor.md) will be ammended to include:

## [[build.buildpacks]]

The build table MAY contain an array of buildpacks. The schema for this table is:

```toml
[[build.buildpacks]]
id = "<buildpack ID (optional)>"
version = "<buildpack version (optional default=latest)>"
uri = "<url or path to the buildpack (optional default=urn:buildpack:<id>)"
shell = "<string (optional default=/bin/sh)>"
inline = "<script (optional)>"
```

This defines the buildpacks that a platform should use on the repo.

Either an `id` or a `uri` MUST be included, but MUST NOT include both. If `uri` is provided the `version`, `inline`, and `shell` MUST NOT be allowed.
