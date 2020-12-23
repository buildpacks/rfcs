# Meta
[meta]: #meta
- Name: Group additions to Builder order
- Start Date: 2020-12-23
- Author(s): [jkutner](@jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This proposal describes a new feature in `project.toml` and `pack` that would allow buildpacks to be injected into the middle, beginning, or end of the groups defined in an `order.toml` provided by a builder.

# Definitions
[definitions]: #definitions

* **injected buildpack** - a buildpack that is added to the beginning, middle, or end of a group.
* **requisite buildpack** - a buildpack that an injected buildpack depends on to insert in the middle of a group.

# Motivation
[motivation]: #motivation

Many buildpack users what the default groups provided by a builder image, but need to inject a single buildpack into the middle, begining, or end of those groups. Today, there is no officially supported way to do this without explicitly specifying all of the builpacks in the group or using an undocumented feature like `from=builder` (but `from=builder` does not allow for injecting a buildpack in the middle of a group). Most recently, we've see this recommended by the [Instana Buildpacks](https://github.com/instana/instana-buildpacks/tree/main/google-cloud-platform/cloud-run).

In many of cases where a buildpack needs to be injected into the middle of a group, the injected buildpack either depends on some other buildpack, or must preceed some other buildpack. For this reason, we will divide the proposed solution into two features: one for injecting in the middle of a group, and one for injecting at the beginning or end.

# What it is
[what-it-is]: #what-it-is

## Injecting in the middle of a group

Buildpacks users can specify an injected buildpack after another buildpack in a group by adding something like the following to their `project.toml`:

```toml
[[build.buildpacks]]
id = "<buildpack ID>"
before = "<buildpack ID>"
```

Or they can inject a buildpack after another another buildpack in a group by adding something like the following to their `project.toml`:

```toml
[[build.buildpacks]]
id = "<buildpack ID>"
after = "<buildpack ID>"
```

The `after` and `before` keys define a requisite buildpack, which the injected buildpack will run either after or before accordingly.

If injected buildpacks need to conditionally run after more than one buildpack, the user can put the `after` and `before` keys in a `[[build.buildpacks.or]]` array of tables.

## Injecting at the beginning or end of a group

A user can also append buildpacks to the beginning of a group with the following configuration in `project.toml`:

```toml
[[build.pre.buildpacks]]
id = "<buildpack ID>"
```

Or append buildpacks to the end of a group:

```toml
[[build.post.buildpacks]]
id = "<buildpack ID>"
```

With the `pack` CLI, the `pre` and `post` buildpacks can be added with the `--pre-buildpack` and `--post-buildack` options.

```
$ pack build --pre-buildpack <buildpack-id> --post-buildpack <buildpack-id>
```

It may not be possible to support the `after` and `before` fields in the `pack` CLI in a way with a good UX.

## Example:  AWS Lambda NodeJS Runtime Interface Client

As an example, consider a buildpack that installs the [AWS Lambda NodeJS Runtime Interface Client](https://www.npmjs.com/package/aws-lambda-ric). It depends on a Node.js NPM buildpack, and is then used by subsequent buildpacks.

A project that wants to use this buildpack might have a `project.toml` with the following configuration.

```toml
[[build.buildpacks]]
id = "jkutner/aws-lambda-ric"
after = "heroku/nodejs-npm"
```

In this way, it can be used with a command like `pack build --builder heroku/buildpacks:18 my-lambda-app`. The buildpack user does not need to know that the Heroku builder includes a group that contains 4 individual buildpacks.

# How it Works
[how-it-works]: #how-it-works

This feature would leverage the same mechanism in `pack` that is used to implement the `from=builder` feature. That is, it extracts the default `order.toml` from the builder, and manipulates it. In this way, `pack` overrides the default order and injects an enriched version of the `order.toml` provided by the builder.

From [`build.go` in `pack`](https://github.com/buildpacks/pack/blob/8692a33074ffdc692e65c40a8a05967240f6cc75/build.go#L597-L602), this looks something like:

```go
newOrder := dist.Order{}
groupToAdd := order[0].Group
for _, bOrderEntry := range builderOrder {
  newEntry := dist.OrderEntry{Group: append(groupToAdd, bOrderEntry.Group...)}
  newOrder = append(newOrder, newEntry)
}

order = newOrder
```

However, in the implementation of this proposal, the

# Drawbacks
[drawbacks]: #drawbacks

- Doesn't allow for arbitrarily inserting a buildpack at a specific position in the middle of a group (ex. in-between the first and second buildpacks).
    - Unsure if this is even realisitic to solve for arbitrary groups. In order to insert at a specific position, you need to know the order.
- The `after` and `before` fields are difficult to replicate in `pack` CLI

# Alternatives
[alternatives]: #alternatives

- Support the `after`, `before`, `pre`, and `post` capabilities directly in Lifecycle
    - this could be configured with something like a [Lifecycle Configuration File](https://github.com/buildpacks/rfcs/pull/128)
- Document `from=builder` and keep it.

# Prior Art
[prior-art]: #prior-art

- `from=builder`
- The [Instana Buildpacks](https://github.com/instana/instana-buildpacks/tree/main/google-cloud-platform/cloud-run) recommend using `from=builder`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What are the real world use cases for injecting in the middle of a group?

# Spec. Changes
[spec-changes]: #spec-changes

This proposal requires changes to the `project.toml` spec extension.

## Schema

The TOML schema of the project descriptor is the following:

```
[[build.buildpacks]]
id = "<string>"
version = "<string>"
uri = "<string>"
after = "<buildpack-id>"
before = "<buildpack-id>"

  [[build.buildpacks.or]]
  after = "<buildpack-id>"
  before = "<buildpack-id>"

[build.pre]

  [[build.pre.buildpacks]]
  id = "<buildpack ID>"
  version = "<string>"
  uri = "<string>"

[build.post]

  [[build.post.buildpacks]]
  id = "<buildpack ID>"
  version = "<string>"
  uri = "<string>"
```

### `[[build.buildpacks]]`

* `after` - defines a requisite buildpack that the given buildpack must run after. If the requisite buildpack is not in the builder's order, the given buildpack will not run. If the requisite buildpack is present, the given buildpack will be inject into that group after the requisite buildpack.
* `before` - defines a requisite buildpack that the given buildpack must run before. If the requisite buildpack is not in the builder's order, the given buildpack will not run. If the requisite buildpack is present, the given buildpack will be inject into that group before the requisite buildpack.

### `[[build.buildpacks.or]]`

Defines a set of `after` and `before` elements for will one will be selected if there is a match in the builder's order groups.

### `[[build.pre.buildpacks]]`

Defines a list of buildpacks to insert at the beginning of an automatically detected group. Given an order with multiple groups, the list of `pre` buildpacks will be inserted at the beginning of each group such that the are run as if they were original included in the group. Each phase of the injected buildpack(s) will execute as normal.


### `[[build.post.buildpacks]]`

Defines a list of buildpacks to insert at the end of an automatically detected group. Given an order with multiple groups, the list of `pre` buildpacks will be inserted at the end of each group such that the are run as if they were original included in the group. Each phase of the injected buildpack(s) will execute as normal.
