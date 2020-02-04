# Meta
[meta]: #meta
- Name: RFC template changes
- Start Date: 2020-02-03
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

As a response to the process of approving [RFC 0013](0013-app-layer-metadata-source.md) which ended up requiring spec changes, this RFC proposes amending the template to include an optional (non-binding) section to document spec changes that fall out of an RFC.

# Motivation
[motivation]: #motivation

Improve the process of moving RFCs into spec and implementation.

# What it is
[what-it-is]: #what-it-is

[0000-template.md](../0000-template.md) gets a new section:

```diff

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

+
+ # Spec. Changes (OPTIONAL)
+ [spec-changes]: #spec-changes
+
+ Does this RFC entail any proposed changes to the specifications (either buildpack or platform) or extensions?
+ This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.
+
```

# How it Works
[how-it-works]: #how-it-works

RFC authors fill out the optional section as discussion and ratification of RFCs uncovers spec changes. These changes should be agreed on as part of the process of approving the RFC.

# Drawbacks
[drawbacks]: #drawbacks

More work for RFC authors, although the contents of this section should likely be supplied by the project maintainers leading the discussion.

# Alternatives
[alternatives]: #alternatives

- Summarize the discussion in a comment.

# Prior Art
[prior-art]: #prior-art

Not sure

# Unresolved Questions
[unresolved-questions]: #unresolved-questions
