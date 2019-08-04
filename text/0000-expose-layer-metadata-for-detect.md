# Meta
[meta]: #meta
- Name: Expose Layer Metadata During Detection Phase
- Start Date: 2019-08-03
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes that we expose layer metadata (for read-only purposes) during detection.
This way, buildpacks could use the previous image to augment their pass/fail decision or build plan contributions.

# Motivation
[motivation]: #motivation

1. This would allow an optional buildpack to opt-out of detection so that its `cache = true` layers are never pulled from a registry-based cache.
   For example, a dedicated caching buildpack might only pass detection if a large cache is needed.

2. This would make the `/bin/detect` interface match the `/bin/build` interface.
   This allows us to extend detection with additional layer-based functionality without making breaking changes.

# How it Works
[how-it-works]: #how-it-works

We extend `/bin/detect` to match `/bin/build`:
```bash
/bin/detect <layers> <platform> <plan>
```

We ensure that layer metadata is restored before detection and cache layers are restored after detection. 

# Drawbacks
[drawbacks]: #drawbacks

- Buildpacks could use the presence of existing layers in the image to skip writing build plan entries.
  This could lead to build plan entries disappearing on re-build.


