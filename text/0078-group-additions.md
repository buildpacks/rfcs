# Meta
[meta]: #meta
- Name: Group additions to Builder order
- Start Date: 2020-12-23
- Author(s): [jkutner](@jkutner)
- Status: Approved
- RFC Pull Request: [rfcs#129](https://github.com/buildpacks/rfcs/pull/129)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/docs#319](https://github.com/buildpacks/docs/issues/319), [buildpacks/pack#1099](https://github.com/buildpacks/pack/issues/1099), [buildpacks/pack#1100](https://github.com/buildpacks/pack/issues/1100), [buildpacks/spec#195](https://github.com/buildpacks/spec/issues/195)
- Supersedes: N/A

# Summary
[summary]: #summary

This proposal describes a new feature in `project.toml` and `pack` that would allow buildpacks to be injected into the beginning or end of the groups defined in an `order.toml` provided by a builder.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

Many buildpack users want to adapt the default groups provided by a builder image by injecting a single buildpack into the begining or end of those groups. Today, there is no officially supported way to do this without explicitly specifying all of the builpacks in the group or using an undocumented feature like `from=builder`. Most recently, we've see this recommended by the [Instana Buildpacks](https://github.com/instana/instana-buildpacks/tree/main/google-cloud-platform/cloud-run).

# What it is
[what-it-is]: #what-it-is

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

## Example:  Instana Buildpack

As an example, consider a buildpack that installs the [Instana Buildpacks](https://github.com/instana/instana-buildpacks/tree/main/google-cloud-platform/cloud-run) and uses the [Google Builder](https://github.com/GoogleCloudPlatform/buildpacks). It might have a `project.toml` with the following configuration:

```toml
[[build.post.buildpacks]]
uri = "containers.instana.io/instana/release/google/buildpack"
```

or run the following command :

```
$ pack build --post-buildpack containers.instana.io/instana/release/google/buildpack --builder gcr.io/buildpacks/builder <image-name>
```

Finally, we will officially deprecate `from=builder` as an acceptable value for the `--buildpack` flag.

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

# Drawbacks
[drawbacks]: #drawbacks

- Doesn't allow for arbitrarily inserting a buildpack at a specific position in the middle of a group (ex. in-between the first and second buildpacks).
    - Unsure if this is even realisitic to solve for arbitrary groups. In order to insert at a specific position, you need to know the order.
- Doesn't allow for overriding a buildpack in a default group.

# Alternatives
[alternatives]: #alternatives

- Support the `pre` and `post` capabilities directly in Lifecycle
    - this could be configured with something like a [Lifecycle Configuration File](https://github.com/buildpacks/rfcs/pull/128)
- Document `from=builder` and keep it.

# Prior Art
[prior-art]: #prior-art

- `from=builder`
- The [Instana Buildpacks](https://github.com/instana/instana-buildpacks/tree/main/google-cloud-platform/cloud-run) recommend using `from=builder`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What are the real world use cases for injecting into a group?
- Do we need a feature that allows a user to insert a buildpack into the middle of a group?
    - Should `pre` and `post` use the same mechanism instead of being different?

# Spec. Changes
[spec-changes]: #spec-changes

This proposal requires changes to the `project.toml` spec extension.

## Schema

The TOML schema of the project descriptor is the following:

```
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

### `[[build.pre.buildpacks]]`

Defines a list of buildpacks to insert at the beginning of an automatically detected group. Given an order with multiple groups, the list of `pre` buildpacks will be inserted at the beginning of each group such that the are run as if they were original included in the group. Each phase of the injected buildpack(s) will execute as normal.


### `[[build.post.buildpacks]]`

Defines a list of buildpacks to insert at the end of an automatically detected group. Given an order with multiple groups, the list of `pre` buildpacks will be inserted at the end of each group such that the are run as if they were original included in the group. Each phase of the injected buildpack(s) will execute as normal.
