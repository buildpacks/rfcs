# Meta
[meta]: #meta
- Name: GitHub repo labels
- Start Date: 02/03/2020
- CNB Pull Request: [rfcs#53](https://github.com/buildpacks/rfcs/pull/53)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

A structure and solution to synchronizing labels across all repositories of the organization.

# Motivation
[motivation]: #motivation

As processes are proposed, there seems to be a desire to use labels to signify status, component, severity, etc. In
order to do this the same across the project it currently requires manual maintenance. This means that certain
desired labels might not exist and although they are relatively easy to create they become harder to maintain. As an
example, pack has [34 labels](https://github.com/buildpacks/pack/labels) while lifecycle has only 
[19 labels](https://github.com/buildpacks/pack/labels). Some difference are stylistic (such as hyphenated, 
capitalization, or color), others that you'd expect apply across both are missing, there are even some that signify the
same thing. Overall it makes it difficult to understand the use of labels from a contributors stand point or an external
party.

# What is it
[what-is-it]: #what-is-it

All associated resources listed here will be housed under [buildpacks/community](https://github.com/buildpacks/community).

- `labels.toml` file with all labels in the entire org.
    - format:
    ```toml
    [[label]]
    name = ""         # name of label as displayed in GitHub 
    color = ""        # an RGB hex color value 
    description = ""  # the description of the label 
    [label.repos]     # repositories associated with this label (if empty, applies to all)
      include = []    # applies to only these repos
      exclude = []    # applies to all repos except these
    ```
- A form of automation that keeps the labels in sync. (eg. GitHub Actions)
- A form of automation that prevents manually created labels from existing.

### Exclusions

- Archived Repos - repositories that are archived will not be synchronized given that they exist in read-only mode.

# How it Works
[how-it-works]: #how-it-works

A `labels.toml` with contents similar to the following would exist in a single repo:

```toml
## Global

[[label]]
name = "good first issue" 
color = "..."
description = "An issue ready for a new contributor."

[[label]]
name = "triage/review" 
color = "..."
description = "Issue should be reviewed as soon as possible."

## Types

[[label]]
name = "type/bug" 
color = "..."
description = "..."
[label.repos]
  exclude = ["community", "rfcs", "spec"]

[[label]]
name = "type/chore" 
color = "..."
description = "..."
[label.repos]
  exclude = ["community", "rfcs", "spec"]

[[label]]
name = "type/enhancement" 
color = "..."
description = "..."
[label.repos]
  exclude = ["community", "rfcs", "spec"]

[[label]]
name = "type/spike" 
color = "..."
description = "..."
[label.repos]
  exclude = ["community", "rfcs", "spec"]

[[label]]
name = "type/support" 
color = "..."
description = "..."
[label.repos]
  exclude = ["community", "rfcs", "spec"]

## Status

# ...

## Others

[[label]]
name = "os/windows" 
color = "..."
description = "Windows specific."
[label.repos]
  include = ["lifecycle", "pack"]
```

Automation will be triggered when changes to this file are made. The automation will ensure the `global` labels exist
on all repositories in the org. It would also ensure that any labels specific to a repository exist
on said repository.

# Drawbacks
[drawbacks]: #drawbacks

- Another "thing" to maintain.
- More friction in creating new labels as it now requires that a file be modified instead of simply creating it via
the UI.
- Additional working knowledge for contributors/maintainers

# Alternatives
[alternatives]: #alternatives

- We could continue to manually create and maintain the labels across all repositories.
- We could try to find a service such as [label-sync.com](https://label-sync.com/) that could do this for us.

# Prior Art
[prior-art]: #prior-art

- [Tekton's plumbing label sync](https://github.com/tektoncd/plumbing/tree/master/label_sync)
- [label-sync.com](https://label-sync.com/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
