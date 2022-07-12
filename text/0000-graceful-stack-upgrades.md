# Meta

[meta]: #meta

- Name: Graceful stack upgrades
- Start Date: 2022-07-12
- Author(s): natalieparellano
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary

[summary]: #summary

This RFC proposes that the lifecycle skip layer re-use and clear its cache when it recognizes that the previous image
was built with a different stack ID.

# Definitions

[definitions]: #definitions

**lifecycle** - software that orchestrates a CNB build; it executes in a series of phases that each have a distinct
responsibility.

**layer re-use** - the lifecycle provides metadata about previously-built layers to buildpacks so that layers can be
re-used if necessary - i.e., the lifecycle can avoid re-uploading unchanged layers to the registry and / or daemon. Only
metadata about layers is copied from the previous image (not data).

**cache** - layers that are not exported but may be needed again at build-time are saved in the cache.

# Motivation

[motivation]: #motivation

Re-using layers that were built with a different underlying OS is unsafe. The layers may depend on OS-level dependencies
that are not present in the new OS, causing errors that can only be seen at runtime. With Ubuntu 18.04 LTS (Bionic
Beaver) [exiting the free initial five-year maintenance period](https://ubuntu.com/about/release-cycle) in April 2023,
other Ubuntu versions - such as 20.04 LTS (Focal Fossa) and 22.04 LTS (Jammy Jellyfish) will become more prevalent in
the CNB ecosystem. Accordingly, the risk is greater that some CNB-built images could break.

Use case: as a platform operator, I want to be able to upgrade my stack to a newer Ubuntu release without worrying that
my images will break.

# How it Works

[how-it-works]: #how-it-works

The lifecycle when reading the previous image metadata will inspect the value of `io.buildpacks.stack.id`. If the value
does not match the value of `CNB_STACK_ID` in the lifecycle's execution environment, the lifecycle will warn and skip
writing previous image metadata. During the `restore` phase, seeing no metadata for `cache=true` layers, the lifecycle
will skip copying layer contents from the cache. During the `build` phase, seeing no metadata for `launch=true` layers,
buildpacks will act as if there is no previous image - i.e., they will create layer contents if necessary.

# Migration

[migration]: #migration

* platform developers: should ensure `io.buildpacks.stack.id` is present on the run image and `CNB_STACK_ID` is set on
  the build image
* buildpack developers: no change
* buildpack users: must endure one slow rebuild per-image when the stack changes
* consumers of buildpack images: no change (though hopefully spared broken images)

# Drawbacks

[drawbacks]: #drawbacks

Why should we *not* do this?

* This proposal results in a one-time penalty per-image of a slow rebuild due to busting the cache. However, sometimes
  it is safe to re-use layers across stacks. Not all users may appreciate this behavior.
* If either of `io.buildpacks.stack.id` or `CNB_STACK_ID` is unset, this effectively disables caching.

# Alternatives

[alternatives]: #alternatives

- What other designs have been considered?
    * Doing nothing.
    * Allowing buildpacks to express whether a layer is safe to re-use across stacks. However, this is one more thing
      for buildpack authors to think about, and may be hard to get right.
    * Putting the onus on platforms to inspect the previous image and pass `-skip-restore` (or the equivalent) to the
      lifecycle when the stack changes. However, it may be more convenient to implement this at the lifecycle level.
- Why is this proposal the best?
    * Easy to understand, easy to implement.
- What is the impact of not doing this?
    * Potentially, broken images.

# Prior Art

[prior-art]: #prior-art

Discuss prior art, both the good and bad.

* [TBD] Not sure what to cite here, feedback welcome.

# Unresolved Questions

[unresolved-questions]: #unresolved-questions

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of
  the solution that comes out of this RFC? When we
  implement [RFC to remove stacks](https://github.com/buildpacks/rfcs/blob/main/text/0096-remove-stacks-mixins.md) the check using stack ID can
  be expanded to look at OS, architecture, architecture variant, distribution, and version. However, that should be
  considered out of scope for this RFC.

# Spec. Changes (OPTIONAL)

[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage
label, etc. This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are
necessary, they should be documented here.

No spec changes necessary, this can be done at the lifecycle level.
