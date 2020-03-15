# Meta
[meta]: #meta
- Name: Add Author to RFC Metadata
- Start Date: 2020-03-14
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This is a proposal to add an `Author(s):` field to the `Meta` section of the RFC template.

# Motivation
[motivation]: #motivation

When an RFC is merged, and then renamed, the commit history is lost. This makes it difficult to remember who wrote the RFC.

# What it is
[what-it-is]: #what-it-is

A new `Author(s):` field in the Meta section of the RFC template.

# How it Works
[how-it-works]: #how-it-works

You're not going to believe this, but you add an `Author(s):` field to the Meta section of the RFC template.

# Drawbacks
[drawbacks]: #drawbacks

Even though the author will be know, the commit history is still hard to find.

# Alternatives
[alternatives]: #alternatives

## RFC PR Link

Instead of an author field, we could enforce that a link to the original RFC PR be added to the RFC after it's merged. This would make it easier to find the author and the history.

# Prior Art
[prior-art]: #prior-art

- Rust uses an ["RFC PR" link](https://github.com/rust-lang/rfcs/blob/master/0000-template.md)
- TensorFlow has an ["Author(s)" field](https://github.com/tensorflow/community/blob/master/rfcs/yyyymmdd-rfc-template.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Does this make it look like only a few person contributed to the RFC (when in reality they are a collaborative process)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

None
