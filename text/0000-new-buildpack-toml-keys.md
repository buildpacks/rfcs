# Meta
[meta]: #meta
- Name: New Buildpack Descriptor Keys
- Start Date: 2020-12-12
- Author(s): [@jkutner](@jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for new keys in the `buildpack.toml` file.

# Definitions
[definitions]: #definitions

* _buildpack descriptor_ - The `buildpack.toml` file that describes a buildpack.

# Motivation
[motivation]: #motivation

New optional fields in the `buildpack.toml` would allow us to introduce more information into the Buildpack Registry search API and the web interface.

# What it is
[what-it-is]: #what-it-is

* Add `description` as a free text field
* Add `licenses` table
* Add `keywords` table

# How it Works
[how-it-works]: #how-it-works

See the spec changes below for full details.

# Drawbacks
[drawbacks]: #drawbacks

- It introduces some free form fields to an otherwise heavily structured descriptor.

# Alternatives
[alternatives]: #alternatives

## Do Nothing

We would not be able to include this information in the Buildpack Registry.

## Put the new keys in `package.toml`

If we want to separate this information from the `buildpack.toml`, we could introduce it to `package.toml`, and only use it when creating a buildpackpage. This would be compatible with the Buildpack Registry because it only support buildpackages.

## Put the new information in the Registry only

This information could be stored in some other way, completely independent of each version (i.e. a name for the buildpack regardless of version). This could be stored in the registry index, or in some annex to it.

# Prior Art
[prior-art]: #prior-art

For prior art, it's very common for to see these fields in the file:
* [gemspec](https://guides.rubygems.org/specification-reference/) (Ruby)
* [`package.json`](https://docs.npmjs.com/cli/v6/configuring-npm/package-json) (JavaScript)
* [`Cargo.toml`](https://doc.rust-lang.org/cargo/reference/manifest.html) (Rust)
* [`pom.xml`](https://maven.apache.org/pom.html) (Java)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes
[spec-changes]: #spec-changes

## buildpack.toml (TOML)

```toml
[buildpack]
description = "<buildpack description>"
keywords = [ "<string>" ]

[[buildpack.licenses]]
type = "<string>"
uri = "<uri>"
```

### `[[buildpack.licenses]]`

An optional list of buildpack licenses.

* `type` - This MAY use the [SPDX 2.1 license expression](https://spdx.org/spdx-specification-21-web-version), but is not limited to identifiers in the [SPDX Licenses List](https://spdx.org/licenses/).
* `uri` - If this buildpack is using a nonstandard license, then this key MAY be specified in lieu of or in addition to `type` to point to the license.
