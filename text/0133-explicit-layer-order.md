# Meta
[meta]: #meta
- Name: Explicit layer ordering
- Start Date: 2025-01-13
- Author(s): [@schneems](https://github.com/schneems)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow buildpack authors to explicitly define a layer order.

# Definitions
[definitions]: #definitions

It's worth noting the current behavior. [Buildpacks](https://github.com/buildpacks/spec/blob/main/buildpack.md) produce layers on disk. These layers are loaded in order to produce a runnable image by the [platform's lifecycle](https://github.com/buildpacks/spec/blob/main/platform.md). The order in which the layers are loaded can have differing effects on the final image outcome. For example, when a layer prepends a value to the `PATH` environment variable, the last layer to be loaded will "win" if multiple layers prepend a path with the same executable name.

Today's behavior is documented [in the buildpack spec](https://github.com/buildpacks/spec/blob/f3fd7555c8320a9da8101f52e6e952e9679fa150/buildpack.md#layer-paths):

> - The lifecycle MUST order all `<layer>` paths to reflect the reversed order of the buildpack group.
> - The lifecycle MUST order all `<layer>` paths provided by a given buildpack alphabetically ascending.

While multiple buildpacks have their execution order preserved implicitly, the layer ordering within a buildpack depends on the layer's name. So changing the name of the layers `gems` and `ruby` to something like `binruby` and `user_gems` would have the effect that executables such as `rake` (which ships with ruby) might now be loaded from a different layer path because the name has a different alphanumeric ordering.

The ordering of layers is important, and the current ordering mechanism (alphanumeric layer names) is not intuitive.

Layers need to be loaded in several locations:

- At "build" time, multiple buildpacks can run simultaneously. If a layer is created with `build=true` in its TOML, it will be loaded and visible to buildpacks that run after it.
- At "launch" time. When an image is finalized, if a layer is created with `launch=true`, it is TOML and will be loaded when the image is launched (such as `docker run`).
- Inside of the same buildpack. A large buildpack may generate several layers that depend on each other. For example the `heroku/ruby` buildpack first downloads a ruby executable and places it in a `ruby` layer. It then executes code such as `gem install` and `bundle install` that depend on that ruby executable. It's a buildpack author's responsibility to make sure any environment variable modifications needed at `build` or `launch` time are also tracked and re-exported (or passed) to code running in the same buildpack.

The "inside of the same buildpack" relies on the order of buildpack execution to load environment modifications, while build and launch rely on the layer's name. The more layers added to a buildpack, the less likely the three ordering locations will match exactly.

# Motivation
[motivation]: #motivation

## Problem statement

- Today a single buildpack can write multiple layers.
- For launch or the next buildpack in build, each layer is evaluated in alphabetic order via the spec.
- This order can differ from the order that layers were written by the buildpack which is surprising and can result in difficult to debug problem.
- We should introduce a mechanism that allows buildpack authors to ensure that build, launch, and "inside of the same buildpack" have the same order of environment variable modification.

> - Why should we do this?

To improve the correctness and reliability of buildpacks

> - What use cases does it support?

> - What is the expected outcome?

Buildpack ordering will be more consistent for those that use this feature. The behavior will be less surprising to buildpack authors and users. Less time will be spent creatively renaming layers to achieve the desired ordering.

# What it is
[what-it-is]: #what-it-is

Allow buildpack authors to document the order in which layers were created by adding a value of `load_order` to a layer's TOML file as it is written.

For example:

```
build = true
launch = true
load_order = 1
```

# How it Works
[how-it-works]: #how-it-works

Add an optional positive numeric field to `<buildpack-layer-dir>/<layer-name>.toml` with a key `load_order`. Buildpack authors start with a number such as `1` and then increment it for every layer they write a new layer. The lifecycle reads these numbers and orders the written layers in the same ascending order. This way, `1` will be evaluated before `2`.

Any layers with a duplicate `load_order` will be evaluated in alphabetic order (the same behavior as today). Any layers without an explicit `load_order` will default to a value of `0`. This default means that any explicitly ordered layers will have their `PATH` modifications prepended after the default layers, which has the effect of taking precedence.

The section should return to the examples from the previous section, and explain more fully how the detailed proposal makes those examples work.

# Migration
[migration]: #migration

This change is a backward-compatible addition. Existing buildpacks will continue to function as they do today. Buildpack authors can begin using this scheme as soon as it is introduced and implemented. It will be a "major" feature addition as buildpacks that implement this feature cannot revert to an older API version that does not have this optional key without error.

# Drawbacks
[drawbacks]: #drawbacks

While TOML supports integers, the current implementation details of the CNB project mean that it is converted to JSON and then back to TOML which loses type information https://github.com/buildpacks/lifecycle/issues/884. This issue may make comparing values for equivalence harder. This behavior prevents me from strongly suggesting that the `load_order` key should be a TOML Integer type.

# Alternatives
[alternatives]: #alternatives

### Prefix naming (do-nothing with a workaround)

The individual buildpack author can implement this same behavior by changing their layer names, for example, changing `gems` to `0001_gems`, etc. This workaround is known as "prefix naming" and has a few drawbacks:

- When using prefix naming, if cached layers are re-ordered, then either their cache needs to be invalidated or moved. For example, if a layer is added before a `gems` layer, it would become `0002_gems`, but if the code tried to load `0002_gems.toml` and its associated layer data from a prior run, it wouldn't exist. This caching behavior means buildpack code must rename and move toml files and layer directories.
  - Some layers may contain binaries that cannot be moved. These binaries contain absolute paths based on the system from where they were compiled, so moving them on disk can result in breakages. In an ideal world, such binaries would not exist, but it's an unrealistic demand to expect application owners to rely on only binaries that are relocatable.
- Debugging instructions or output may vary between applications. For example, one tutorial might say run `/layers/heroku_ruby/0003_gems/bin/rake -v` while the user's application has that layer in a different order. While this is a minor problem for experienced developers who can `ls` that directory and might understand that `0004_gems` is effectively the same as `0003_gems`, it will trip up newer developers.
- These values show up to the user and look odd/off. For example, this output comes from the `heroku/ruby` buildpack:

```
BUNDLE_BIN="/layers/heroku_ruby/0003_gems/bin" \
BUNDLE_CLEAN="1" BUNDLE_DEPLOYMENT="1" \
BUNDLE_GEMFILE="/workspace/Gemfile" \
BUNDLE_PATH="/layers/heroku_ruby/0003_gems" \
BUNDLE_WITHOUT="development:test"
bundle install`
```

This aesthetic issue is not the most severe concern but is worth noting.

**Overall**: These issues make this workaround approach viable, but not ideal for most situations. The spec would benefit from a more explicit definition of layer ordering within a buildpack.

### Alternative key names

Because naming is a known hard problem, we could use alternative key names:

- `order=1`
- `ordering=1`
- `layer_order=1`
- `layer_ordering=1`
- `load_order=1`
- `load-order=1`
- `priority=1`
- `load_priority=1`
- `precedence=1`
- Something else

My suggestion to buildpack authors would be that they provide the same order in which layers are written; this will mean that code evaluated within a buildpack will behave the same way as code in the `build` phase of another buildpack or at the `launch` time. Rather than introducing some abstract concept such as priority or precedence, I tried to be as literal with the name `order` and what it affects (the order in which layers are loaded). Therefore the suggestion is `load_order`.

### Alternative value formats

The value of `load_order` could be some other type: string, table, array, boolean, date, etc. It could also have different semantics. For example, it could be `load_after = ["<other-layer-name>"]` where like `load_after = ["gems", "ruby"]` where the order would need a resolution phase. While this is familiar to users of tools such as `rake` and `make` or other tools that support dependent tasks, it makes the ordering less clear and introduces failure points such as misspellings.

Choosing the value to be a positive numeric value and tying it to a name such as `load_order` it makes intuitive sense that `2` will be loaded after `1`. It also makes intuitive sense for buildpack authors that their load order should match their layer write order.

Buildpack authors can easily increment a value. Bash buildpack authors can do so like this:

```term
# Set an initial order value
export LAYER_LOAD_ORDER=0

# Increment it
LAYER_LOAD_ORDER=$((LAYER_LOAD_ORDER+1))
```

An alternative type could be "string," such as `layer_order=a`. This type is more permissive but less comprehensible to developers. Also, different languages may order strings in different ways. A stronger numeric (integer) type is preferable over a "strongly" typed value.

A value such as a date or time might not have sufficient fidelity and takes more computational power to parse and produce than an integer. It's also a benefit that the same ordering of layers (with an integer) will result in the exact same TOML files on disk.

### Alternative restrictions or behaviors to the key or value

- The `load_order` key could be required. This change would prevent ambiguous buildpacks from lingering. However, it would be a breaking change to the current ecosystem. Some buildpacks might have only a single layer and this is unneeded. For other buildpacks operating correctly today, there's no strong need to add this ordering information.
  - A future RFC could add a configuration to a buildpack's `buildpack.toml` that would make omitting this value result in an error or warning.
We could make duplicate values an error. For example, two layers with `load_order=1` could generate an exception and stop the build process instead of falling back to alphanumeric layer name ordering.
  - I chose to make the feature more permissive to make it easier to adopt. In the event of a duplicate value, the lifecycle could issue a warning, or we could make the warning/error behavior configurable via the `buildpack.toml`. Future RFCs could change the default behavior of duplicate keys.

### Store the data somewhere that's other than the existing TOML file

We could introduce a `<buildpack-name>/order.toml` or some other file so that its name could be appended to the bottom of the order when a new layer is created.

Doing this in bash is difficult if the value is a TOML array. If the value is a TOML table, then it would have a meaningless value, which would be confusing. It is easier to forget needing to write two values to two files than to remember to write two values to one file (the existing `<layer>.toml` file).

### Non-toml alternative: Finalize layer binary

The current interface of CNBs relies on writing configuration and modifying files on disk. However, it doesn't have to be limited to this configuration mode. Introducing an executable such as `cnb_lifecycle` could inform how a layer is finalized. For example, a buildpack author could call `cnb_lifecycle layer:finalize <layer-name>` or use it to initialize a layer `$ cnb_lifecycle layer:init <layer-name>` and then the lifecycle can choose how to store ordering invocation information it would use it when launching a layer.

This approach would greatly depart from how buildpacks interact with the lifecycle—stating it here for completeness.


# Prior Art
[prior-art]: #prior-art

- This [lifecycle issue elaborates on the problems that come up when an environment (build/launch) disagrees on the ordering of layers](https://github.com/buildpacks/lifecycle/issues/1393)
- Prior [similar issue](https://github.com/buildpacks/lifecycle/issues/170)
- Spike implementing a [prefix ordering workaround for the `heroku/ruby` buildpack](https://github.com/heroku/buildpacks-ruby/pull/384).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - All
- What parts of the design do you expect to be resolved through implementation of the feature?
  - All
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
  - Resolving https://github.com/buildpacks/lifecycle/issues/884 would make value identity comparison easier for lifecycle implementers.

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes

> Does this RFC entail any proposed changes to the core specifications or extensions?

Yes, these are discussed at a high level above.

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->
