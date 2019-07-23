# Meta
[meta]: #meta
- Name: Buildpack Configuration for Distribution
- Start Date: July 22, 2019
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to change the schema of `buildpack.toml` to separate the
concerns of defining a buildpack and managing configuration of buildpacks.

# Motivation
[motivation]: #motivation

In the approval of the [Distribution Spec](https://github.com/buildpack/rfcs/blob/master/text/0007-spec-distribution.md),
we landed on a [compromise that no one was really happy with](https://github.com/buildpack/rfcs/pull/11#issuecomment-510483638).
We now propose a new `buildpack.toml` schema that will, hopefully, satisfy all parties.

The Distribution Spec defines a `buildpack.toml` schema containing an array of `[[buildpacks]]` that may include references to buildpacks in a registry or a path to a buildpack in the same repo. For example:

```toml
[[buildpacks]]
id = "io.buildpacks.nodejs"
name = "Node.js Buildpack"
version = "0.0.9"
[[buildpacks.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]

[[buildpacks]]
id = "io.buildpacks.npm"
name = "NPM Buildpack"
version = "0.0.7"
path = "./npm-cnb/"

[[buildpacks]]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"
path = "./node-cnb/"
```

The entries in the `[buildpack.order.group]` must use an `id` and `version` that point to an entry in this file, or a buildpack in a registry. This creates the following problems:

- The array of buildpacks hints at order, but it cannot be used to create a group(s) that are run against an app/service repo. The list of buildpacks only defines the configuration for a loose collection of buildpacks and cannot be resolved into a group/order.
- The `buildpack.toml` cannot be used "to run a buildpack" without additional information (i.e. it doesn't describe a single buildpack). This is problematic for platforms that want to run the buildpack (and its `buildpack.toml`) directly without pre-packaging (such as with `pack build --buildpack`).
- Information must be repeated in order to define the `io.buildpacks.nodejs` metabuildpack (i.e. if I update the version of the node-engine buildpack I must change it in several different places).
- It's unclear how this schema supports `buildpack.toml` files in subdirectories (i.e. decoupled from the top level `buildpack.toml`). For example, when `path` is used, can the directory it points to contain a `buildpack.toml`? If so, does that `buildpack.toml` override the `id`, `version`, etc in the top-level `buildpack.toml`? And if so, which buildpack in the `[[buildpacks]]` array is used to override?

# What it is
[what-it-is]: #what-it-is

Terminology:

* **buildpackage**: the distributable artifact that represents a buildpack. It may be one of the formats described in the distribution spec.
* **metabuildpack**: a buildpack that defines an order, but does not contain it's own `bin/detect` or `bin/build`. It also does not define its own list of `stacks` (it inherits the union of stacks from its constituent buildpacks).

The target personas for this change include buildpack author, buildpack user, and platform implementor. Buildpack authors will be concerned with the `buildpack.toml` schema changes. Buildpack users will be concerned with what buildpacks they can use from a `buildpack.toml` (i.e. when passing options to `pack build --buildpack`). And platform implementors will be concerned with how a `buildpack.toml` is published.

We propose the following changes to `buildpack.toml`:

- Add a required top level `[buildpack]` table that describes buildpack configuration.
- Remove the `[[buildpacks]]` array of tables.
- Add support for `[[buildpack.order]]` array, which defines the ordering of buildpack.
- Add support for `path` to the `order.group = [{}]` table so that `id` and `version` do not have to be repeated and can instead be derived from a nested `buildpack.toml`.
- Add a `[[buildpack.dependencies]]` array that defines a list of buildpacks that must be included in the buildpackage. The schema of the `dependencies` table matches the `[buildpack]` table (minus `dependencies`).
- Add a `[buildpack.metadata]` table that is unstructured.
- Add a `[[buildpack.stacks]]` array of tables that is required for buildpacks that do not define a `[[buildpack.order]]` (i.e. non-metabuildpacks). The `stacks` table contains an `id` with the name of a stack.

In order for a repository to be run by a platform, included in a builder, or packaged into a buildpackage; it must contain a `buildpack.toml` with the `buildpack.id` and `buildpack.version` keys. For example:

```toml
[buildpack]
id = "<string>"
version = "<string>"
```

The top level `[buildpack]` table may contain an `order` key. This key has a schema similar to the `[[buildpack.order]]` described in the Distribution Spec, but now with support for a `path` key in a group. The `path` key can be used to reduce redundancy in the `buildpack.toml` by pointing to a nested `buildpack.toml` files that contain buildpack metadata. For example:

```toml
[[buildpack.order]]
group = [
  { path = "node-cnb" },
  { path = "buildpack.npm.toml" },
]
```

In this case, the `node-cnb/` directory contains a `buildpack.toml`. In this way, the `id` and `version` do not have to be repeated, which reduces the need to change/update them in multiple places. It also reduces the risk of mistakes. Similarly, the repository contains a `buildpack.npm.toml` at the root, which contains configuration for an `npm` buildpack.

Alternatively, the `group` may contain a `id` and `version` like this:

```toml
[[buildpack.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]
```

When `id` and `version` are used, a platform will attempt to resolve the group entry to a buildpack in the `[[buildpack.dependencies]]` array. The `[[buildpack.dependencies]]` array is a list of buildpacks that are associated with the main buildpack. For example:

```toml
[[buildpack.dependencies]]
id = "<string>"
version = "<string>"
path = "<string>"
```

Any buildpack defined in the `[[buildpack.dependencies]]` array (regardless of whether it is used in a group or not) will be included in the packaging of the buildpack.

# How it Works
[how-it-works]: #how-it-works

The following examples describe how the new elements can be used in practice.

## Example: Basic buildpack

The `buildpack.toml` file contain the configuration for a single buildpack:

```toml
[buildpack]
id = "com.example.node"
name = "Node.js Buildpack"
version = "0.0.9"

[[buildpack.stacks]]
id = "io.buildpacks.stacks.bionic"
```

As long as this repository also contains a valid `bin/detect` and `bin/build`, it can produce a valid buildpack.

## Example: Same code, different buildpack

These elements described above can be used to define a metabuildpack that includes two buildpacks sharing the same source code, but are published as two distinct buildpacks with different `id` values:

```toml
[buildpack]
id = "com.example.myapm"
name = "APM Buildpack"
version = "0.0.9"
[[buildpack.order]]
group = [
   { id = "com.example.myapm.node", version = "0.0.7" }
]
[[buildpack.order]]
group = [
   { id = "com.example.myapm.java", version = "0.0.5" }
]

[[buildpack.dependencies]]
id = "com.example.myapm.node"
name = "APM Buildpack for Node"
version = "0.0.7"
path = "."

[[buildpack.dependencies]]
id = "com.example.myapm.java"
name = "APM Buildpack for Java"
version = "0.0.5"
path = "."
```

This supports the use case described in the discussion of the [Distribution Spec](https://github.com/buildpack/rfcs/pull/12#issuecomment-504781945).

## Example: Node.js buildpack with composite `buildpack.toml` file

This example is equivalent to the `buildpack.toml` described in the [Distribution Spec](https://github.com/buildpack/rfcs/blob/master/text/0007-spec-distribution.md) and shown earlier in the [Motivation](#motivation) section. However, we now define the `buildpack.toml` with a `[buildpack]` table and `[[buildpack.dependencies]]` array:

```toml
[buildpack]
id = "io.buildpacks.nodejs"
name = "Node.js Buildpack"
version = "0.0.9"
[[buildpack.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]

[[buildpack.dependencies]]
id = "io.buildpacks.npm"
name = "NPM Buildpack"
version = "0.0.7"
path = "./npm-cnb/"

[[buildpack.dependencies]]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"
path = "./node-cnb/"
```

## Example: Node.js buildpack with multiple `buildpack.toml` files

This example describes a buildpack defined in the same repository as the buildpacks it's composed from, but with separate `buildpack.toml` files to define the constituents. The directory structure is:

```
nodejs-cnb/
├── buildpack.toml
├── node-cnb
│   └── buildpack.toml
└── npm-cnb
    └── buildpack.toml
```

The root `buildpack.toml` contains the following:

```toml
[buildpack]
id = "io.buildpacks.npm-nodejs"
name = "NPM Node.js Buildpack"
version = "0.0.9"
[[buildpack.order]]
group = [
  { path = "node-cnb" },
  { path = "npm-cnb" },
]
```

The `node-cnb/buildpack.toml` contains the following:

```toml
[buildpack]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"

[[buildpack.stacks]]
id = "io.buildpacks.stacks.bionic"

[[buildpack.stacks]]
id = "org.cloudfoundry.stacks.cflinuxfs3"

[buildpack.metadata.dependencies]
id      = "node"
name    = "Node.js runtime"
version = "0.1.1"
uri     = "https://example.org/node.tgz"
sha256  = "18682e55a8cefcc5a7b76000138ab6856a75d5e607aa7af5d28f84e2217fc66a"
```

The `npm-cnb/buildpack.toml` contains the following:

```toml
[buildpack]
id = "io.buildpacks.npm"
name = "NPM Buildpack"
version = "0.0.7"

[[buildpack.stacks]]
id = "io.buildpacks.stacks.bionic"
```

In this example, the configuration for each buildpack in the metabuildpack is decomposed into separate `buildpack.toml` files such that they can be used or published on their own.

## Example: Ruby buildpack with Node.js

In this example, a self-contained Ruby buildpack can define a composite buildpack that use itself and a Node.js buildpack to form a buildpackage. The `io.buildpacks.ruby-node` buildpack isn't used, but is optionally available for platforms that may wish to consume it.

```toml
[buildpack]
id = "io.buildpacks.ruby"
name = "Ruby Buildpack"
version = "0.0.7"
[[buildpack.stacks]]
id = "io.buildpacks.stacks.bionic"

[[buildpack.dependencies]]
id = "io.buildpacks.ruby-node"
name = "Ruby with Node.js Buildpack"
version = "0.0.9"

[buildpack.dependencies.order]
group = [
  { id = "io.buildpacks.node", version = "0.0.5" },
  { id = "io.buildpacks.ruby", version = "0.0.7" },
]
```

# Drawbacks
[drawbacks]: #drawbacks

- Requires a single buildpack per `buildpack.toml`, which may not be preferable in certain monorepo situations. With hope that the support for separate `buildpack.toml` files referenced with `path` will mitigate this.
- This proposal does not do a good job of supporting the use case where a `buildpack.toml` must define multiple buildpacks that have no connection to each other. We propose two patterns that accomodate this case:
    * Pick one lucky buildpack to define in the `[buildpack]` table, and add the others to the `[[buildpack.dependencies]]` array.
    * Use the `[[profiles]]` alternative described below.

# Alternatives
[alternatives]: #alternatives

This proposal provides a good balance of concerns. It accommodates the need to define multiple buildpacks in a `buildpack.toml`, while still allowing a 1:1 pattern between `buildpack.toml` and a buildpack. The 1:1 pattern is important to ensure that no odd inferences are defined in the spec (like treating the first buildpack in the `[[buildpacks]]` array as special). This allows a `buildpack.toml` to stand on its own such that it can be used without any outside configuration (like a `package.toml`) if the platform allows it.

However, there are alternatives we could implement, but they favor one concern over another.

## Using only a `[[buildpacks]]` array of tables

This is essentially what is described in the Distribution Spec.

## Add a `[[profiles]]` array of tables

A top-level `[[profiles]]` array of table would allow for zero or many named "profiles" that can override the configuration defined in the `buildpack.toml`. The `profiles` table would have the same schema as the `buildpack.toml` itself (minus the `profiles`).

For example:

```toml
[buildpack]
id = "com.example.myapm.node"
name = "APM Buildpack for Node"
version = "0.0.7"

[[profiles]]
  name = "java"

  [buildpack]
  id = "com.example.myapm.java"
  name = "APM Buildpack for Java"
```

This example, a platform may package the `buildpack.toml` with no other inputs and the result would be a `com.example.myapm.node` buildpackage. But if the platform accepted a `--profile java` option, the `buildpack.id` and `buildpack.name` would be overridden, and a `com.example.myapm.java` buildpackage would be produced.

In the use case where multiple *independent* buildpacks need to be defined in the same `buildpack.toml`, a profile can be used to override the main buildpack. For example:

```toml
[buildpack]
id = "com.example.npm-node"
name = "NPM Node.js Buildpack"
version = "0.0.7"
[[buildpack.order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.9" },
]

[[buildpack.dependencies]]
id = "io.buildpacks.node"
name = "Node Engine Buildpack"
version = "0.0.5"

[[buildpack.dependencies]]
id = "io.buildpacks.npm"
name = "NPM Buildpack"
version = "0.0.9"

[[buildpack.dependencies]]
id = "io.buildpacks.yarn"
name = "Yarn Buildpack"
version = "0.0.8"

[[profiles]]
  name = "yarn"

  [buildpack]
  id = "com.example.yarn-node"
  name = "Yarn Node.js Buildpack"
  [[buildpack.order]]
  group = [
     { id = "io.buildpacks.node", version = "0.0.5" },
     { id = "io.buildpacks.yarn", version = "0.0.8" },
  ]
```

In this way, the `buildpack.toml` can be used directly (without specifiying a `-profile`) and the `com.example.npm-node` is run. But if the `--profile yarn` option is passed to a platform, the `com.example.yarn-node` is run.

# Prior Art
[prior-art]: #prior-art

- The `buildpack.toml` definition in [Distribution Spec](https://github.com/buildpack/rfcs/blob/master/text/0007-spec-distribution.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How is an unresolved reference in a buildpack's `order` handled?
- Can a buildpackage be incomplete (i.e. missing some buildpacks referenced in the `buildpack.toml`)?
