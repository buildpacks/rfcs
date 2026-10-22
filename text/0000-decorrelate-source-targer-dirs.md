# Meta
[meta]: #meta
- Name: Decorrelate source dans target directories
- Start Date: 2023-04-03
- Author(s): @xfrancois
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: [Can't make final image directory different from the CNB_APP_DIR](https://github.com/buildpacks/lifecycle/issues/1034)
- Supersedes: N/A

# Summary
[summary]: #summary

Allow CNB users to build image from one directory and have the final image directory structure to be something else. Currently it's possible to change the default target directory (/workspace) by setting the `CNB_APP_DIR` environement variable, but the source directory must also be the one specified in `CNB_APP_DIR`. This behavior is not well suited for constrained environements, like CI.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

- Why should we do this?

We should do this to provide more flexibility for end-users.

- What use cases does it support?

Building from a CI tool, for example Gitlab-CI. We can't chose the source directory from which we are building. On Gitlab-CI the Git folder is checkout on `/builds/<group>>/<project>`. By having a way to decorrelate source and target directories, we could chose the finaly directory structure we want.

- What is the expected outcome?

Support of a new environment variable / parameter that allows to set the source directory. We probably should document that  `CNB_APP_DIR` only handles the target directory.

| Variable           | Default value | Description                |
|--------------------|---------------|----------------------------|
| `CNB_APP_DIR`       | `/workspace`    | Target directory structure |
| `CNB_SOURCE_APP_DIR` | `$CNB_APP_DIR`  | Source directory structure |

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users.

# How it Works
[how-it-works]: #how-it-works

In the Gitlab-CI example, I can't chose the source directory but I want to be able to chose the target directory. I will set the variables like this :

`CNB_SOURCE_APP_DIR`: /builds/group/project

`CNB_APP_DIR`: /workspace

The final image will be available

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

N/A

# Alternatives
[alternatives]: #alternatives

- What is the impact of not doing this?

The impact is that people wanting to use CNB on CI environment will have to make some workaround (like copying source folders in another location) in order to have a proper directory structure in the final image.

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.

# History
[history]: #history

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