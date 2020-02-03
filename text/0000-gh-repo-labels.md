# Meta
[meta]: #meta
- Name: GitHub repo labels
- Start Date: 02/03/2020
- CNB Pull Request: (leave blank)
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
same thing. Overall it makes it difficult to understand the use of labels.  

# What is it
[what-is-it]: #what-is-it

- `labels.toml` file with all labels in the entire org.
    - format:
    
    ```toml
    [[global]]        # table list of labels to by applied to ALL repos
      name = ""         # name of label as displayed in GitHub 
      color = ""        # an RGB hex color value 
      description = ""  # the description of the label 
  
    [repo]            # (only here for TOML to create the repo object)
        
      [[repo.<repo-name>]]  # table list of labels to by applied to repo <repo-name>
        name = ""         # name of label as displayed in GitHub 
        color = ""        # an RGB hex color value 
        description = ""  # the description of the label 
    ```
- A GitHub action that keeps the labels in sync.

# How it Works
[how-it-works]: #how-it-works

A `labels.toml` with contents similar to the following would exist in a single repo:

```toml
[[global]]
  name = "good first issue"
  color = "..."
  description = "An issue ready for a new contributor."

[[global]]
  name = "triage/review"
  color = "..."
  description = "Issue should be reviewed as soon as possible."

[repo]
    
  [[repo.pack]]
      name = "os/windows"
      color = "..."
      description = "Windows specific."
    
    [[repo.lifecycle]]
      name = "os/windows"
      color = "..."
      description = "Windows specific."
```

A GitHub actions will be triggered when changes to this file are made. The action will ensure the `global` labels exist
on all repositories in the org. It would also ensure that any labels specific to a repository (`repo.<repo-name>`) exist
on said repository.

Any labels not listed in this file would get deleted. This is to ensure a single source of truth and enables the
capability of mass cleanup.

# Drawbacks
[drawbacks]: #drawbacks

- Another "thing" to maintain.
- More friction in creating new labels as it now requires that a file be modified instead of simply creating it via
the UI.

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

- Where does this live? [community](https://github.com/buildpacks/community) or new "plumbing" repo?