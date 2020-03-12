# Meta
[meta]: #meta
- Name: Include all layer metadata in final image
- Start Date: 2020-03-12
- CNB Pull Request: 
- CNB Issue: 
- Supersedes: N/A

# Summary
[summary]: #summary

Currently, the only layer metadata that is included in a final image
is the layer metadata for that image's launch layers. It would benefit
image debugging and build reproducibility to include _all_ layer
metadata in the final image.

# Motivation
[motivation]: #motivation

At the highest level, non-launch layer metadata can help us to know
things about non-launch layers that participated in an image build,
which things we might need to know in order to reproduce a
build. Buildpacks users might want to know things about such
non-launch layers when they discover a problem in an image, or a
problem in a build; some such problems will depend on non-launch
layers that participated in the build.

Having implemented this feature, buildpack users and authors will have
more information with which to debug and reproduce builds.

Consider a build that can only be reproduced if the state of the cache
is reproduced (the `@` notation means some git repo at some SHA):

1. I build `some-app @ 000000`.
2. I build `some-app @ 111111`.
3. I notice a problem in the build for `some-app @ 111111`.
4. I build `some-app @ 111111` without a cache, but cannot reproduce
   the problem.
5. I look at the layer metadata for the image associated with
   `some-app @ 111111` and find that all of the layers used in its
   weird build were generated using `some-app @ 000000`.
6. I build `some-app @ 000000` without a cache (to "seed" the cache).
7. I build `some-app @ 111111` with the cache from `some-app @ 000000`
   and reproduce the issue.

This example conflates the related issue of knowing what version of an
application a particular layer arose from; however, the first step
towards surfacing that information could be including all layer
metadata in an image. Given that the layer metadata will be preserved,
the buildpack author user or the platform could add the application's
version (e.g. a git SHA) to the layer metadata.

Along similar lines, non-launch layer metadata could include the
SHA256 ID of the non-launch layers that participated in a build, which
could allow users to know precisely which layers particiapted in a
build.

Conceivably, associating a non-launch layer with an application
verison could have a first-class representation. However, as is, the
buildpacks system cannot tell a user all of the layers that were used
in a build. This feature would enable users to address this need, and
unanticipated and specialized needs around non-launch layer metadata,
for themselves.

# What it is
[what-it-is]: #what-it-is

The contents of `<layer>.toml` files will be reflected in resulting
images' labels.

Consider the following `<layer>.toml` for some layer that participates
in the build of an image `sample-app:latest`:

```toml
build = false
cache = false
launch = false

[metadata]
  [metadata.application.git]
    sha = "b4ddf00d"
```

As is, the image `sample-app:latest` would not contain this metadata
in its labels, or in its filesystem, because the metadata does not
contain the top-level `.launch = true` key/value.

Having implemented this feature, the key
`.metadata.application.git.sha`, and its value, would exist in
`sample-app:latest`'s labels.

# How it Works
[how-it-works]: #how-it-works

Layer metadata for all layers should be included in the existing
`io.buildpacks.lifecycle.metadata` label, as this is already the place
where launch-layer metadata is stored. Doing so would be mostly
backwards compatible; the layer metadata for all layers is a superset
of the layer metadata for launch layers.

# Drawbacks
[drawbacks]: #drawbacks

* It's not perfectly backwards compatible; users who expect to be able
  to use the value of the `io.buildpacks.lifecycle.metadata` label to
  enumerate an image's launch layers will get different results;
  having implemented this feature, that enumeration would reveal all
  of the layers that participated in that image's build. Still, it
  should be simple to refactor any such code to further filter by
  `launch = true`.
* Image labels will grow; is this an absue of image labels?

# Alternatives
[alternatives]: #alternatives

One alternative might be to leave the `<layer>.toml` files on disk; I
don't think that this would result in any technical conflict, but it
might be confusing to see nothing else of those layers.

Even if this feature isn't implemented, some users will want to know
this information, and might be inclined to implement this feature for
themselves; homegrown implementations might take the form of a
buildpack that extracts metadata from all layers, or an additional
step that directly inspects layers after a build.

# Prior Art
[prior-art]: #prior-art

N/A?

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should Buildpacks have an opinion about what an application version
  is, and should that information be represented first-class instead
  of in arbitrary metadata?
- Should non-launch layer IDs be exposed at all? If so, should it have
  a first-class representation?
