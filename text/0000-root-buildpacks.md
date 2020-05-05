# Meta
[meta]: #meta
- Name: Root Buildpacks
- Start Date: 2020-05-03
- Author(s): [Joe Kutner](https://github.com/jkutner/)
- RFC Pull Request:
- CNB Pull Request:
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for a type of buildpack that runs as the `root` user.

# Motivation
[motivation]: #motivation

Everything is a buildpack. Allowing some buildpacks to run with privileges would give users a way to perform many common operations they expect to be possible based on their experience with other tools like `Dockerfile`.

Root buildpacks would make it possible to install OS packages dynamically during build, which would allow users to customize their base image without needing to create an intermediary builder or stack. Root buildpacks would increase the orthogonality of the buildpack interface by allowing users to leverage the same constructs to do many things.

The advantages of using a buildpack for privileged operations are the same as for unprivileged operations: they are composable, fast (caching), modular, reuseable, and safe.

As an example, consider the use case of Acme.com. They have three teams that want to contibute privileged layers to every image built at the company. Each of these teams wants to manage their own artifacts and the mechanisms for installing them, but none of these teams are in control of the base image. The teams have special logic for when their layers should be added to an image; in some cases it's the precense of a Node.js app, and in others it's the use of Tomcat, etc. In the past, these teams were trying to contribute their layers by selectively adding them to every `Dockerfile` for every base image in the company, but this didn't scale well. With Root Buildpacks, each team can manage their own artifacts, release cadence, and add logic to `bin/detect` to ensure the layers are added when needed.

Root Buildpacks would give users the power of `Dockerfile` for privileged operations, without coupling the implementation to a particular app or base image.

# What it is
[what-it-is]: #what-it-is

Definitions:

* _privileged_ - operating system users who have been delegated extra levels of control
* _overlayfs_ - allows one, usually read-write, directory tree to be overlaid onto another, read-only directory tree

A buildpack can optionally request that it be run with privileges (i.e. as the `root` user). When this flag is set, the lifecycle will mount an overlay filsystem before before its build phase runs, such that all changes to the filesystem (except for special directories) can be added to a layer.

# How it Works
[how-it-works]: #how-it-works

Introduce a boolean `privileged` key in the `[buildpack]` table of `buildpack.toml`, which is defined as follows:

```
[buildpack]
privileged = <boolean (default=false)>
```

When `privileged` is set to `true`, the lifecycle will run this buildpack as the `root` user if the build is run with the `--privileged` flag ([see below](#not-using-root-buildpacks)).

For each Root Buildpack, the lifecycle will mount an overlay filesystem before the buildpack's build phase executes (excluding `/tmp`, `/cnb`, and `/layers`). The buildpack can then create layers normally by writing to the `<layers>/` directory the same way an unprivileged buildpack would. However, a new `paths` key would be added to the `<layers>/<layer>.toml` schema:

```
paths = ["<path glob>"]
launch = <boolean>
build = <boolean>
cache = <boolean>
```

The `paths` array defines the directories and files from the overlay filesystem that should be included in the layer. If an unprivileged buildpack uses the `paths` key, it will be ignored.

## Using Root Buildpacks

An app that wants to use the Root Buildpack would include the buildpack in the `[[build.buildpacks]]` array of tables of the `project.toml` like any other buildpack.

## Not Using Root Buildpacks

A new `--privileged` option would be added to `pack build` and lifecycle that allows Root Buildpacks to run. If a build contains a root buildpack and the `--privileged` flag is not set, the build will fail.

## Example: Imagemagick Buildpack

For a buildpack that installs the Imagemagick package, the `buildpack.toml` would look like:

```toml
[buildpack]
id = "example/imagemagick"
privileged = true
```

The `bin/build` would look like:

```bash
#!/usr/bin/env bash

apt update
apt install imagemagick

cat << EOF > ${1}/usr.toml
paths = [ "/usr" ]
launch = true
build = true
cache = true
EOF

cat << EOF > ${1}/var.toml
paths = [ "/var" ]
launch = false
build = false
cache = true
EOF
```

## Implementation Details

The overlay filesystem can be simulated by running the following:

```
$ docker run --rm --privileged -it ubuntu:bionic bash
root@f1442b4c03bb:/# mkdir -p /tmp/overlay && mount -t tmpfs tmpfs /tmp/overlay && mkdir -p /tmp/overlay/{usr,work}

root@f1442b4c03bb:/# mount -t overlay -o lowerdir=/usr,upperdir=/tmp/overlay/usr/,workdir=/tmp/overlay/work/ overlay /usr/

root@f1442b4c03bb:/# apt update
...
24 packages can be upgraded. Run 'apt list --upgradable' to see them.

root@f1442b4c03bb:/# apt install tree
...
Setting up tree (1.7.0-5) ...

root@f1442b4c03bb:/# tree /tmp/overlay/usr/
/tmp/overlay/usr/
|-- bin
|   `-- tree
`-- share
    `-- doc
        `-- tree
            |-- changelog.Debian.gz
            `-- copyright

4 directories, 3 files
```

A similar behavior is implemented in the `moby/moby` project's [`daemon/graphdriver/overlay2/overlay.go`](https://github.com/moby/moby/blob/1.13.x/daemon/graphdriver/overlay2/overlay.go).

# Drawbacks
[drawbacks]: #drawbacks

* Some buildpack users will not want to give root access to any-and-all buildpacks. Instead they may want to selectively whitelist certain root buildpacks.
* The overlayfs could get messy
    - is it portable (windows?)
    - will there be unexpected edge cases?
    - works for docker...
* Changes in the build image will not necessarily be applicable to the run image. It requires dilligence on the part of the end user.
* A root buildpack could mess up file permissions such that subsequent buildpacks cannot read some files.

# Alternatives
[alternatives]: #alternatives

- [RFC: App Image Extensions (OS packages)](https://github.com/buildpacks/rfcs/pull/23)
- Instead of adding `path` to the `<layer>.toml`, the lifecycle could save the entire overlay as a layer. This mimics the behavior of the `RUN` directive of `Dockerfile`.
- Make the overlay filesystem optional by adding a boolean `overlay` key in the `[buildpack]` table in `buildpack.toml`. When disabled, the Root Buildpack would still have root access, but it's changes to the filesystem would be discarded.

# Prior Art
[prior-art]: #prior-art

* [Docker's overlayfs](https://github.com/moby/moby/blob/1.13.x/daemon/graphdriver/overlay2/overlay.go)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should a root buildpack be able to run after an unprivileged buildpack?
    - What if a user needs to perform some privileged operation after the JVM installed?
- How can this mechanism be extended to support builder extension (such that changes to the builder and run/build images happen outside of a user build)?
    - We could have a `pack extend-builder` that runs (root) buildpacks to extend the build/run image.
- What are the costs/implications of the overlay filesystem?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

The following spec changes will be made as a result of accepting this proposal.

## `buildpack.toml`

This proposal adds two fields to `[buildpack]` table in `buildpack.toml`:

```
[buildpack]
privileged = <boolean (default=false)>
overlay = <boolean (default=false, requires privileged=true)>
```

* `privileged` - when set to `true`, the lifecycle will run this buildpack as the `root` user, unless the build is run with the `--protected`.
* `overlay` - when set to `true`, the lifecycle will mount an overlay filesystem before the buildpack's build phase executes.


## `<layers>/overlay.toml`

This proposal adds a new file to the output of the Build phase:

| Output                         | Description
|--------------------------------|-----------------------------------------------
| `<layers>/overlay.toml`        | Layer metadata for the overlay layer (see [Layer Content Metadata](https://raw.githubusercontent.com/buildpacks/spec/master/buildpack.md#layer-content-metadata-toml))
