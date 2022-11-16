# Meta
[meta]: #meta
- Name: Move layer types to new table in layer.toml
- Start Date: 2021-01-05
- Author(s): natalieparellano
- Status: Approved
- RFC Pull Request: [rfcs#132](https://github.com/buildpacks/rfcs/pull/132)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/spec#185](https://github.com/buildpacks/spec/issues/185), [buildpacks/lifecycle#522](https://github.com/buildpacks/lifecycle/issues/522), [buildpacks/docs#296](https://github.com/buildpacks/docs/issues/296)
- Supersedes: N/A

# Summary
[summary]: #summary

Introduces a new table in `<layers>/<layer>.toml` to enable Bash buildpacks to easily opt in to layer re-use.

# Definitions
[definitions]: #definitions

# Motivation
[motivation]: #motivation

[RFC 0052](https://github.com/buildpacks/rfcs/blob/main/text/0052-opt-in-layer-caching.md) described a change (to be implemented in Buildpack API 0.6) whereby buildpacks must opt in to layer re-use - i.e., each `<layers>/<layer>.toml` will be restored with no `launch`, `build`, or `cache` flags set and buildpacks must modify the restored TOML to set these flags.

The RFC assumed that Bash buildpacks would be able to easily opt in to layer re-use by appending lines to the TOML, e.g.:

`echo "launch = true" >> layer.toml`

However, because `launch`, `build`, and `cache` are top level keys, the above command would add a `launch` key to the `[metadata]` table instead of the top level.

# What it is
[what-it-is]: #what-it-is

This RFC proposes moving the `launch`, `build`, and `cache` keys into a new `types` table in `<layers>/<layer>.toml`:

```toml
[types]
launch = true
build = false
cache = false
```

A Bash buildpack could then write something like the following:

```bash
cat >> launch.toml <<EOL
[types]
launch = true
EOL
```

This change should be implemented with Buildpack API 0.6 so that it goes hand-in-hand with the opt in layer re-use feature.

- If a buildpack implementing Buildpack API less than 0.6 tries to write `<layers>/<layer>.toml` with a `[types]` table, the lifecycle should fail.
    - From opt in layer RFC: <layers>/<layer>.toml will be restored with the top level keys intact for older buildpack apis.
- If a buildpack implementing Buildpack API 0.6 or above tries to write `<layers>/<layer>.toml` with a top level `launch`, `build`, or `cache` key, the lifecycle should fail.
- For either buildpack API, if a buildpack were to mistakenly append bare `launch`, `build`, or `cache` keys to `<layers>/<layer>.toml` they would just be part of metadata.

# Drawbacks
[drawbacks]: #drawbacks

- Why should we *not* do this? Having `launch`, `build`, and `cache` as top level keys potentially makes more sense in describing a layer.

# Alternatives
[alternatives]: #alternatives

- Bash buildpack authors could prepend to the TOML file.
- What is the impact of not doing this? Potentially aggravating extra labor for Bash buildpack authors.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- **Out of scope:** Since we are moving the `launch`, `build`, and `cache` keys, could they be re-named for further clarity?
- Is `types` the right name for this table?
- Would any changes be necessary to [`io.buildpacks.lifecycle.metadata`](https://github.com/buildpacks/spec/blob/main/platform.md#iobuildpackslifecyclemetadata-json)? This label includes `launch`, `build`, and `cache` keys for each referenced layer. If so, should the lifecycle standardize this label for buildpacks implementing different Buildpack APIs?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Under [Layer Content Metadata](https://github.com/buildpacks/spec/blob/main/buildpack.md#layer-content-metadata-toml):

```toml
[types]
launch = false
build = false
cache = false

[metadata]
# buildpack-specific data
```

This change should be implemented with Buildpack API 0.6.
