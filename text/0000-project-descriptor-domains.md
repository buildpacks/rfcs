# Meta
[meta]: #meta
- Name: Project Descriptor Domains
- Start Date: 2021-02-26
- Author(s): hone
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [PR#95](https://github.com/buildpacks/rfcs/pull/95)

# Summary
[summary]: #summary

Change the Project Descriptor so all keys will live under a reverse domain namespace.

# Motivation
[motivation]: #motivation

The current spec of the Project Descriptor is simple but restrictive for companies and other projects to adopt it for their own use case. The only level of non-spec'd customization is through the toml table `[metadata]` for arbitrary keys. This brings a lot of benefits and flexibility for the project. Unfortunately, this is fairly restrictive for anyone looking to extend the Project Descriptor for their own use case. Not being allowed to create your own "top level" keys, means non build concerns will be treated as "second class citizens". For instance, if you were using CNB for a FaaS product, it's plausible to have an `[event]` key to configure invocation that would be native to that platform. Forcing all this config to be under `[metadata]` is awkward.

By not allowing this level of control, it limits the Project Descriptor's ability to be used in various configurations. In practice, Cloud Native Buildpacks only cares about defining a limited set of the schema.

# What it is
[what-it-is]: #what-it-is

The Project Descriptor will move to using reverse domains for top level keys as namespaces. This does two things:

1. Allows any top level customization.
1. Removes conflict of top level keys.

The current schema as part of this proposal would look something like this:

```TOML
[project]
id = "<string>" # machine readable
name = "<string>" # human readable
version = "<string>"
authors = ["<string>"]
documentation-url = "<url>"
source-url = "<url>"

[[project.licenses]]
type = "<string>"
uri = "<uri>"

[io.buildpacks]
api = "0.2"

[io.buildpacks.build]
include = ["<string>"]
exclude = ["<string>"]
[[io.buildpacks.build.buildpacks]]
id = "<string>"
version = "<string>"
uri = "<string>"
[[io.buildpacks.build.env]]
name = "<string>"
value = "<string>"
```

`[project]` table is fairly generic and not buildpack specific, so it will remain as the only non reverse domain key.

`[build]` now becomes `[io.buildpacks.build]`. With these new namespaces, we can also spec the schema version for our own namespace. This will be schema `0.2` since the [current extension spec is `0.1`](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md). The [schema validation RFC](https://github.com/buildpacks/rfcs/blob/main/text/0054-project-descriptor-schema.md) can now be applied just to our own `[io.buildpacks]` namespace.

Schema versioning is a feature any reverse domain namespace can do as well.

## Non Buildpacks Project Descriptor Example

For a non-project buildpacks project adopting the [fly.io](https://fly.io) `fly.toml` taken from the [phoenix-liveview-clustoer example app](https://github.com/fly-apps/phoenix-liveview-cluster/blob/master/fly.toml):

```TOML
[io.fly]
app = "liveview-counter"

kill_signal = "SIGTERM"
kill_timeout = 5

[io.fly.experimental]
private_network = true

[[io.fly.services]]
  internal_port = 4000
  protocol = "tcp"

  [io.fly.services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[io.fly.services.ports]]
    handlers = ["http"]
    port = "80"

  [[io.fly.services.ports]]
    handlers = ["tls", "http"]
    port = "443"

  [[io.fly.services.tcp_checks]]
    grace_period = "30s" # seems to take about 30s to boot
    interval = "10s"
    port = "8080"
    restart_limit = 0
    timeout = "2s"
```

## Backwards Compatibility

The bundler project switched from YAML to a proprietary Ruby DSL for the `Gemfile` and was able to detect the differences to determine which version to use. Our parsers can detect for `[io.buildpacks]` key specifically to differentiate between the two. In the future, the API key under this table can be used.

# How it Works
[how-it-works]: #how-it-works

This is outlined in ["What it is"](#what-it-is).

# Drawbacks
[drawbacks]: #drawbacks

There are two major drawbacks:

- This is a backwards breaking change and the schemas aren't compatible at all.
- TOML doesn't use whitespacing to determine nesting, so the full key is used which can be verbose.

# Alternatives
[alternatives]: #alternatives

This suprsedes the [Project Descriptor Flexibility RFC](https://github.com/buildpacks/rfcs/pull/95).

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should `[project]` still stay as a top level key?
- Should the reverse domains be "quoted" like "io.buildpacks"?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This will require a change to the [Project Descriptor Extensions spec](https://github.com/buildpacks/spec/blob/main/extensions/project-descriptor.md). The overall change will include the `[project]` key as it stands today as well as the move to reverse domain notation for other keys. The `[io.buildpacks]` will now contain its own schema as well.
