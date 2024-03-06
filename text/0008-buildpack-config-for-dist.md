# Meta
[meta]: #meta
- Name: Buildpack Configuration for Distribution
- Start Date: July 22, 2019
- Status: Implemented
- CNB Pull Request: [rfcs#15](https://github.com/buildpacks/rfcs/pull/15)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to change the schema of `buildpack.toml` to separate the
concerns of defining a buildpack and managing configuration of buildpacks.

# Motivation
[motivation]: #motivation

In the approval of the [Distribution Spec](https://github.com/buildpacks/rfcs/blob/main/text/0007-spec-distribution.md),
we landed on a [compromise that no one was really happy with](https://github.com/buildpacks/rfcs/pull/11#issuecomment-510483638).
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
- Add support for `[[order]]` array, which defines the ordering of buildpack.
- Add a `[metadata]` table that is unstructured.
- Add a `[[stacks]]` array of tables that is required for buildpacks that do not define a `[[order]]` (i.e. non-metabuildpacks). The `stacks` table contains an `id` with the name of a stack.

In order for a repository to be run by a platform, included in a builder, or packaged into a buildpackage; it must contain a `buildpack.toml` with the `buildpack.id` and `buildpack.version` keys. For example:

```toml
[buildpack]
id = "<string>"
version = "<string>"
```

The top level `[[order]]` table has a schema similar to the `[[buildpack.order]]` described in the Distribution Spec. The `group` key may contain an `id` and `version` like this:

```toml
[[order]]
group = [
   { id = "io.buildpacks.node", version = "0.0.5" },
   { id = "io.buildpacks.npm", version = "0.0.7" },
]
```

The `id` and `version` pair will be resolved to a buildpack by the platform.

## Optional Build Plan Groups
To simplify `buildpack.toml`, this RFC will also be extending the [Contractual Build Plan RFC](https://github.com/buildpacks/rfcs/blob/main/text/0005-contractual-build-plan.md) to include the ability to add additional groupings of `provides` and `requires` inside of a `[[or]]` Array.

```toml
[[or]]
[[or.requires]]
name = "nodejs"
[or.requires.metadata]
version = "LTS"
[[or.provides]]
name = "node.js"
```

The `[[or]]` Array is optional, but the top-level `[[requires]]` and `[[provides]]` must be provided first if the Build Plan is being used.

For a given buildpack group, a sequence of trials is generated by selecting a single potential Build Plan from each buildpack in a left-to-right, depth-first order. The group fails to detect if all trials fail to detect.

This supports the use case described in the discussion of the [Distribution Spec](https://github.com/buildpacks/rfcs/pull/12#issuecomment-504781945), by providing a single buildpack that can generate two different build plan groupings.

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

[[stacks]]
id = "io.buildpacks.stacks.bionic"
```

As long as this repository also contains a valid `bin/detect` and `bin/build`, it can produce a valid buildpack.

## Example: Node.js buildpack with multiple `buildpack.toml` files

This proposal does not include support for a monorepo buildpack (i.e. a repository that contains source code for multiple distinct buildpacks).

# Drawbacks
[drawbacks]: #drawbacks

- Requires a single buildpack per `buildpack.toml`, which may not be preferable in certain monorepo situations. With hope that the support for separate `buildpack.toml` files referenced with `path` will mitigate this.
- This proposal does not do a good job of supporting the use case where a `buildpack.toml` must define multiple buildpacks that have no connection to each other. We propose the `[[profiles]]` pattern alternative described below to accomodate this case.

# Alternatives
[alternatives]: #alternatives

The 1:1 pattern is important to ensure that no odd inferences are defined in the spec (like treating the first buildpack in the `[[buildpacks]]` array as special). This allows a `buildpack.toml` to stand on its own such that it can be used without any outside configuration (like a `package.toml`) if the platform allows it.

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

- The `buildpack.toml` definition in [Distribution Spec](https://github.com/buildpacks/rfcs/blob/main/text/0007-spec-distribution.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How is an unresolved reference in a buildpack's `order` handled?
- Can a buildpackage be incomplete (i.e. missing some buildpacks referenced in the `buildpack.toml`)?
