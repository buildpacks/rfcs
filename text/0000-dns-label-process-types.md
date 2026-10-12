# Meta

- Name: DNS Label Compatible Process Types
- Start Date: 2025-03-30
- Author(s): @joshwlewis
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request:
- CNB Pull Request:
- CNB Issue:
- Supersedes:

# Summary

Process type identifiers, as defined in the Cloud Native Buildpacks buildpack specification, are less restrictive than the RFC 1123 DNS label definition. Therefore, CNB process types may not be compatible with internet routing or Kubernetes resource naming. This RFC proposes stricter process type identifier requirements to increase compatibility with other CNCF / OSS projects as well as RFC 1123.

# Definitions

**RFC 1123**: The IETF ["Requirements for Internet Hosts" RFC](https://datatracker.ietf.org/doc/html/rfc1123#section-2.1) describes the syntax for DNS host names, domain names, and labels.

**Kubernetes Resource Names**: Many resource names are restricted to RFC 1123, as outlined [here](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names).

**Process Type**: The `type` identifier for a launch process as [specified in `launch.toml`](https://github.com/buildpacks/spec/blob/main/buildpack.md#launchtoml-toml).

# Motivation

The images resulting from CNB builds are often deployed to internet connected environments, where it's useful to connect or manage the image lifecycle with an internet routable domain name.

For example, after building a web service image with Cloud Native Buildpacks, developers might want to expose various processes to the internet like static-assets.myapp.com and api.myapp.com. However, process types may currently include `_`, making process types like `Static_Assets` allowed, but not internet routable -- `Static_Assets.myapp.com` is not a valid domain name.

Or, developers might want to manage Kubernetes resources dynamically using process types defined in the resulting image:

```
kubectl autoscale replicaset static-assets --max=6 --min=2 --cpu-percent=50
```

However, while CNB allows a `Static_Assets` process type, Kubernetes rejects it as a resource name:

```
object name does not conform to Kubernetes naming requirements: "Static_Assets"
```

These incompatibilities make using process types in dynamic scenarios challenging.

# What it is

The current Buildpack specification defines these process type restrictions:

> MUST only contain numbers, letters, and the characters ., \_, and -.

While DNS Labels as defined in RFC 1123 are more restrictive. Some notable differences:

- Underscores (`_`) are not allowed
- Periods (`.`) are not allowed
- Dashes ('-') are not allowed as the first or last character
- Uppercase and lowercase letters are not differentiated
- Must be less than 63 characters

The buildpack specification will be modified to require process types compatible with RFC 1123 for DNS Labels, and require lowercase letters for compatibility with Kubernetes.

# How it Works

The platform specification will be changed to reject process types that do not comply with lowercased RFC 1123 DNS Labels. When a process type fails to meet this syntax, appropriate error messaging may be given by the platform, for example:

```
The "Static_Assets" process type must comply with lowercased RFC 1123 DNS label syntax. Underscores are not allowed. Uppercase letters are not allowed."
```

While uppercase letters are allowed in RFC 1123, uppercase and lowercase are not differentiated -- `API` and `api` are the same. DNS providers and Kubernetes enforce (or coerce) uppercase to lowercase to prevent duplicate entries with different casing. The buildpack spec should also enforce lowercase letters for the same reason.

# Migration

This is a breaking API change, and will require a new Buildpack API version.

Buildpacks specifying process types that do not comply with the stricter requirements proposed in this RFC will need to change the way process types are defined. Buildpacks defining process types dynamically should implement logic to coerce process types (by substitution, filtering and/or truncation) to meet the specification and avoid build failures.

In order to ease the transition, a new flag may be introduced to pack and/or lifecycle to control enforcement of this requirement. For example, a `--strict-process-types` flag could be introduced that might be set to `warn` or `error`. Calls with `pack build foo --strict-process-types=error ...` would emit error messages and reject builds with non-compliant process types while calls with `pack build foo --strict-process-types=warn ...` would emit warning messages while still allowing the build to complete.

With a flag like this, the migration could be split into phases:

Phase 1: `--strict-process-types` has a default value of `warn`
Phase 2: `--strict-process-types` has a default value of `error`
Phase 3 (optional): `--strict-process-types` is always `error`

# Drawbacks

- It's a breaking API change and will cause ecosystem churn.

# Alternatives

## Enforce RFC 1123 host names

Instead of enforcing the DNS label syntax, enforce the host name syntax. This would allow periods (in correct postions) and allow up to 253 characters.

Pros:

- Less restrictive
- would allow internet routing and kubernetes compatibility.

Cons:

- Buildpacks are unlikely to know/set the correct fully qualified domain for an image that might be deployed many places
- Deployment platforms couldn't use use process types as a subdomain (since the buildpack may have chosen a 254 character process type)

## Do Nothing

If we do nothing, developers in our ecosystem will not be able to use process types for internet routing or Kubernetes resource names.

# Prior Art

N/A

# Unresolved Questions

- Are there additional resources in the spec that should also have this restriction?

  - Image names? (probably not, given it's common to use url-based image names with periods and slashes)

- Is this change worth creating a new Buildpack API version?
  - Maybe not on it's own, but perhaps it could be bundled with other features.

# Spec. Changes (OPTIONAL)

This change will require changes to the Buildpack API spec.

# History

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

```

```
