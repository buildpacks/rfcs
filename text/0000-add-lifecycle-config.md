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

In order to allow platforms to have more dynamic configurations, a new configuration file (`config.toml`) could be loaded by lifecycle binaries.

# Definitions
[definitions]: #definitions

- Configuration File - New file to hold configuration that is currently achieved by ENV vars or flags. Proposed name is `config.toml`.

# Motivation
[motivation]: #motivation

- Why should we do this?
  - This will allow platform operators to change configuration in workflows previously not easily available to them.

Specifically, if a platform needs to make decisions about how to build a project it must currently make all the lifecycle decision outside of the container the application may be being built in.

A concrete example is a platform that wishes to honor `project.toml`. The project itself contains the buildpacks that are to be used and the platform will not rely on the default `order.toml` specified in the `company/builder`. The platform does not own `company/builder` and does not know ahead of time if a particular project will specify buildpacks in the `project.toml`. The only ways to specify a custom `order.toml` is via env var or CLI flag. The platform can set either of these, but the location must be known to the platform ahead of the container creation in the case of k8s. This means the platform may have to extract the end user source code, process the `project.toml`, and then communicate the buildpacks, if any, to the platform. A k8s platform would be forced to run this `project.toml` in a different pod in order to determine the location of the `order.toml` that might have been generated for `lifecycle/detector`. Being able to change configuration and not make assumptions about the builder that may be used in later steps while remaining in the same k8s pod as the build itself is desirable. The platform can work around this in a couple different ways today, but this feels restricting for little gain.

In the example above, the platform can now generate a `config.toml` in a step prior to `lifecycle/detector` based on the application source code and platform specific variables.

```
[config]
order-path = "/artifacts/generated-order.toml"
log-level = "debug"
```

This configuration file would be stored in a pod volume and then mounted in at `/cnb/config.toml` in the `lifecycle/detector` container, overriding the configuration that may exist on the builder.

- What use cases does it support?
  - Platforms that run all phases in a single kubernetes pod will have the ability to write configuration before and after each phase for the upcoming phases using a volume.

- What is the expected outcome?
  - Platforms that use the buildpacks.io published images like `buildpacksio/lifecycle` will have a method to configure how lifecycle behaves by writing a file in a configurable location.
  - This will open up platform operators to be able to generate a configuration file based on information that may not be available at pod creation time but is available once the source code is available.
  - Some platforms may move from setting `CNB_*` env vars to producing a `config.toml`.

# What it is
[what-it-is]: #what-it-is

Target persona: platform operator, platform implementor

A new `config.toml` will be read by lifecycle. By default, this path searched will be `/cnb/config.toml`. `CNB_CONFIG_PATH` would be available to override this location.

An example `config.toml` might be produced by the platform with various inputs (target source code, platform specific configuration, etc.):
```
[config]
order-path = "/artifacts/generated-order.toml"
no-color = true
log-level = "debug"
```

An example config resolution would be, in prioritized order, CLI flag, os env `CNB_ORDER_PATH`, `[config.toml][config]order_path`, then the `lifecycle` default of `/cnb/order.toml`.

The keys of the `[config]` table are expected to match the env var names, minus the `CNB_` prefix and kebab-case.

# How it Works
[how-it-works]: #how-it-works

Lifecycle will read in `CNB_CONFIG_PATH` or the default of `/cnb/config.toml` and prioritize the values found over lifecycle's defaults and before present env vars.

If there is no configuration found, lifecycle will resolve configuration as it does today. That order is cli flag, env var, default.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

Another configuration file.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - Lifecycle could introduce a `prepare` phase that processes a project's `project.toml` to generate the input files needed by detector, much like `pack` does today.
  - Lifecycle could load env vars from a known file location. e.g. `source lifecycle.env` or similar prior to resolving lifecycle configuration.
  - Lifecycle could only allow for non-path based inputs like `log-level` in `config.toml`, but add an additional path to to a known platform location. Example would be `/cnb/config/order.toml` for `CNB_ORDER_PATH`. This would allow platforms to use a volume at `/cnb/config` and write files that are fed into lifecycle in addition to a `config.toml` for non-path based configuration.
  - Lifecycle could load up values via a similar method that lifecycle's launcher does. e.g. `/platform/env/lifecycle/CNB_ODER_PATH`
- Why is this proposal the best?
  - A well defined configuration file feels less convoluted and less stack specific
- What is the impact of not doing this?
  - Operators are forced to make assumptions about the stack a builder is built on to load up `CNB_` env vars from previous containers in a single k8s pod scenario.
  - Operators will be forced to configure distroless `buildpacksio/lifecycle` containers from env vars or not use distroless images

# Prior Art
[prior-art]: #prior-art

Several CLIs allow for configuration outside of env vars and CLI flags. Some examples are listed below.

- `~/.pack/config.toml`
- `~/.kube/config`
- `~/.docker/config.json`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Is the convention based name of `CNB_ORDER_PATH` to `order_path` appropriate? We could introduce a schema for this file that is more rigid.
- Do we need the root `[config]` table? 
- If a builder has `CNB_ORDER_PATH` set explicitly, the `config.toml` will not be able to override it without the platform explicitly removing the env vars.
- If a builder creates `/cnb/config.toml` and a platform mounts on top of it, the platform will lose any configuration that may be required to successfully execute the builder. Should `/cnb/config.toml` be disallowed on builders? Perhaps the path should be `/platform/config.toml`?


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

TODO
