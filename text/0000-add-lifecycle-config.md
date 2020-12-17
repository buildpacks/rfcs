# Meta
[meta]: #meta
- Name: Add Lifecycle Configuration File
- Start Date: 2020-12-17
- Author(s): @Jabrown85
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

In order to allow platforms to have more dynamic configurations, a new configuration file (`lifecycle.toml`) could be loaded by lifecycle binaries.

# Definitions
[definitions]: #definitions

- Configuration File - New file to hold configuration that is currently achieved by ENV vars or flags. Proposed name `lifecycle.toml`.

# Motivation
[motivation]: #motivation

- Why should we do this?
  - This will allow platform operators to change configuration in workflows previously not easily available to them.
- What use cases does it support?
  - Platforms that run all phases in a single kubernetes pod will have the ability to write configuration before and after each phase for the upcoming phases using a volume.
- What is the expected outcome?
  - Platforms that use the buildpacks.io published images `buildpacksio/lifecycle` will have a method to configure how lifecycle behaves by writing a file in a configurable location. 
  - This will open up platform operators to be able to generate a configuration file based on information that may not be available at pod creation time.
  - Some platforms will move from setting `CNB_*` env vars to producing a `lifecycle.toml`.

# What it is
[what-it-is]: #what-it-is

Target persona: platform operator, platform implementor

A new `lifecycle.toml` will be read by lifecycle. By default, this file will be searched at `/cnb/lifecycle.toml`. `CNB_CONFIG_PATH` would be available to override this location.

An example `lifecycle.toml` might be produced by the platform with various inputs (source code, platform specific configuration, etc.):
```
[config]
app_dir = "/workspace/extracted-folder-name"
cache_dir = "/volumes/cnb-cache"
order_path = "/artifacts/generated-order.toml"
no_color = true
log_level = "debug"
```

An example config resolution would be, in prioritized order, env `CNB_ORDER_PATH`, `[lifecycle.toml][config]order_path`, then the lifecycle default of `/cnb/order.toml`.

The keys of the `[config]` table are expected to match the env var names, minus the `CNB_` prefix and lowercased.

# How it Works
[how-it-works]: #how-it-works

Lifecycle will read in `CNB_CONFIG_PATH` or the default of `/cnb/lifecycle.toml` and prioritize the values found over lifecycle's defaults and before present env vars.

If there is no configuration found, lifecycle will resolve configuration as it does today (env vars, defaults).

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Another configuration file.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Lifecycle could load env vars from a known file location. e.g. `source lifecycle.env` or similar prior to resolving lifecycle configuration.
- Why is this proposal the best?
  - A well defined configuration file feels less convoluted and less stack specific
- What is the impact of not doing this?
  - Operators are forced to make assumptions about the stack a builder is built on to load up `CNB_` env vars from previous containers in a single k8s pod scenario.
  - Operators will be forced to configure distroless `buildpacksio/lifecycle` containers from env vars or not use distroless images

# Prior Art
[prior-art]: #prior-art

TODO

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is the convention based name of `CNB_ORDER_PATH` to `order_path` appropriate? We could introduce a schema for this file that is more rigid.
- Do we need the root `[config]` table? 


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

TODO
