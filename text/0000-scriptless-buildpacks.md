# Meta
[meta]: #meta
- Name: Scriptless Buildpacks
- Start Date: 7/24/2019
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for new elements in `buildpack.toml` that support the definition of executable buildpacks that contain neither a `bin/detect` nor a `bin/build` (i.e. the `buildpack.toml` can be the only file, but it's still a valid buildpack).

# Motivation
[motivation]: #motivation

One characteristic of `Dockerfile` that Buildpacks do not replace will is the ability to create a single, one-off file to quickly define a custom build process for an app or project. A `Dockerfile` may contain just a few lines of code, and a developer can generate a complete image.

Conversely, the only quick way to create a custom build for an app using a buildpack is by creating no fewer than three files: `buildpack.toml`, `bin/build`, and `bin/detect`.

We seek to make reduce the barrier to entry for buildpacks when a developer needs to quickly create a custom, one-off build.

# What it is
[what-it-is]: #what-it-is

Terminology:

- **scriptless**: a buildpack that does not contain the `bin/detect`, `bin/build`, or any other scripts

The target personas for this RFC are the buildpack author and buildpack user who need to create a custom, one-off build or are just getting started with buildpacks and do not want the overhead of a new repo.

We propose the following new tables in `buildpack.toml`:

- `[buildpack.detect]`: (optional) contains elements that are used to perform buildpack detection.
- `[buildpack.build]`: (optional)  contains elements that are used to perform buildpack building.

Both of these new tables are mutually exclusive with `[[buildpack.order]]`.

## `[buildpack.detect]`

```toml
[buildpack.detect]
run = ["<string>"] # bash commands
requires = [ "<string>"] # defines required entries in the build plan
provides = [ "<string>" ] # defines provided entries in the build plan
```

If `buildpack.detect.run` is not defined, and either `buildpack.detect` or `buildpack.build` are defined, then detection will always pass. Otherwise, the exit code of the last `run` command is used.

## `[buildpack.build]`

```toml
[buildpack.build]
run = [ "<string>" ]

[[buildpack.build.layers]]
id = "<string>"
cache = "<boolean>"
launch = "<boolean>"
build = "<boolean>"
run = [ "<string>" ]

  [buildpack.build.layers.metadata]
  key = "<string>" # arbitrary elements that will be put directly into the layer metadata

  [buildpack.build.layers.env]
  KEY = "<string>" # env vars that will be put into `<layer_dir>/env`

  [[buildpack.build.layers.profile]]
  # each table in this array will be turned into a <layer_dir>/profile.d script
  name = "<string>"
  script = [ "<string>" ]

[[buildpack.build.launch.processes]]
# each table in this array will be turned into an entry in `launch.toml`
type = "<string>"
command = "<string>"
```

The lifecycle will use the `layer.id` value to determine if the layer should be regenerated. If the layer is already present (because of caching) and the metadata matches it will skip all other behavior defined in this table. This behavior is effectively described by the following Bash code:

```bash
if [[ -f ${layers_dir}/${layer_id}.toml ]]; then
  if [[ "$(cat ${layers_dir}/${layer_id}.toml)" != "${derived_layer_toml}" ]]; then
   # execute `run` and other directives
  fi
fi
```

Thus, if you want to force a layer to regenerate, the `[buildpack.build.layers.metadata]` must contain appropriate keys to determine if they layer has changed.

The commands defined in any `run` element will have access to script arguments (i.e. `$1`, `$2`, etc) as defined in the [Buildpack Spec](https://github.com/buildpack/spec/blob/master/buildpack.md), as well as other environment variables the lifecycle makes available.

# How it Works
[how-it-works]: #how-it-works

The following examples demonstrate about a scriptless buildpack works in practice (from the buildpack author persona).

## Example: JRuby Warbler buildpack

This buildpack is used to run a `rake` command after a JRuby build:

```toml
[buildpack]
id = "io.buildpacks.warbler"
name = "Warbler Buildpack"
version = "0.0.9"

[buildpack.detect]
requires = [
  "jruby",
  "warbler",
  "bundler"
]
provides = [
  "war"
]

# if there is a bin/build, this will always run first.
[buildpack.build]
run = [
  "rake war",
  "rake db:migrate"
]

[[buildpack.build.launch.processes]]
type = "web"
command = "java -jar myapp.war"
```

The buildpack requires `jruby`, `warbler`, and `bundler` be installed by previous buildpacks. It then provides a `war` file.

The build will run two `rake` commands, and then it generates a default `web` command. But no layers are created.

## Example: JDK buildpack

This buildpack is functionally similar to the [sample Java buildpack](https://github.com/buildpack/samples/blob/master/java-buildpack/).

```toml

[buildpack]
id = "io.buildpacks.zulu"
name = "Azul Zulu Buildpack"
version = "0.0.9"

[buildpack.detect]
provides = [
  "jdk"
]

[[buildpack.build.layers]]
id = "jdk"
cache = "true"
launch = "true"
build = "true"
run = [
  "export JDK_URL=https://cdn.azul.com/zulu/bin/zulu8.28.0.1-jdk8.0.163-linux_x64.tar.gz",
  "wget -q -O - $JDK_URL | tar pxz -C $1/jdk --strip-components=1"
]

  [buildpack.build.layers.metadata]
  version = "zulu-1.8.0_163"

  [buildpack.build.layers.env]
  JAVA_HOME = "$1/jdk"
  LD_LIBRARY_PATH = "$JAVA_HOME/jre/lib/amd64/server"

  [[buildpack.build.layers.profile]]
  name = "jdk.sh"
  script = [
    "export JAVA_HOME=$1/jdk",
    "export LD_LIBRARY_PATH=$JAVA_HOME/jre/lib/amd64/server"
  ]

[[buildpack.build.launch.processes]]
type = "web"
command = "java -jar *.jar"
```

The buildpack provides a `jdk`. It has one layer that is made available to launch, build, and cache.

# Drawbacks
[drawbacks]: #drawbacks

- We might be encouraging a bad practice. While the scriptless buildpack is extremely useful, it may drive developers to code themselves into a corner when the buildpack eventually becomes complex enough that it needs to be rewritten as a buildpack with scripts.
- The logic around regenerating a layer or not may be confusing and ultimately intractable.

# Alternatives
[alternatives]: #alternatives

- The inline buildpack approach described in the Project Descriptor RFC helps solve this problem too, but still requires the scripts.

# Prior Art
[prior-art]: #prior-art

- `Dockerfile` is similar in the use case it addresses.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How do we merge the scriptless buildpack with scripts in `bin/` if they are eventually created?
- What is the migrate path for a developer who has created a fairly complex scriptless buildpack, and now wants to port it to a `bin/build`.
- Should we include a key that will force a layer to always regenerate?
