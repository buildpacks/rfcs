# Meta
[meta]: #meta
- Name: RFC Issue Generation
- Start Date: 2020-03-03
- Author(s): @jromero
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A" (TODO: There may be an RFC to mention here)

# Summary
[summary]: #summary

This RFC proposes additional information to be added to the RFC template that would be filled out during the RFC process. 
This information would later be used by automation to generate issue in the appropriete repositories.

# Definitions
[definitions]: #definitions

- [RFC]()
- [Repositories]()
- [Maintainers]()

# Motivation
[motivation]: #motivation

The current RFC process requires labels for individual sub-teams of relevance to be added. 
Later, after the RFC has been approved, it requires maintainers of affected sub-teams to create issues on their respective repositories.
This typically happens days, weeks, if not months after the maintainers might have reviewed the RFC. 
In addition, it usually requires the person merging the RFC to hunt down (or ping) any maintainers for sub-teams that haven't created relevant issues.

# What it is
[what-it-is]: #what-it-is

The proposal would be to add the following information somewhere in the RFC template:

```markdown
# Issues to Create

<!-- THIS SECTION IS INTENDED TO BE FILLED BY MAINTAINERS DURING THE RFC PROCESS. -->

Issues listed below will be created once this RFC is approved and merged:

<!--
  FORMAT: - <repo>: <title> [labels]...
  EXAMPLES:
      - buildpacks/lifecycle: Implement something
      - buildpacks/pack: Support this thing [good first issue][status/triage]
-->
```

# How it Works
[how-it-works]: #how-it-works

<!--
This is the technical portion of the RFC, where you explain the design in sufficient detail.
The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.
-->

TODO

# Drawbacks
[drawbacks]: #drawbacks

<!--
Why should we *not* do this?
-->

TODO

# Alternatives
[alternatives]: #alternatives


### Use comments instead

```text
/pending-issue buildpacks/pack: implement feature A [good first issue]
```

### Keep information seperate

Find an alternative location to store this information that the maintainers would use.

Examples:

    - Google Sheets
    - Seperate Repository

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

# Issues to Create

<!-- THIS SECTION IS INTENDED TO BE FILLED BY MAINTAINERS DURING THE RFC PROCESS. -->

Issues listed below will be created once this RFC is approved and merged:

<!--
  FORMAT: - <repo>: <title> [labels]...
  EXAMPLES:
      - buildpacks/lifecycle: Implement something
      - buildpacks/pack: Support this thing [good first issue][status/triage]
-->

- buildpacks/rfcs: Add "issues to create" to RFC template
- buildpacks/rfcs: Automate "issue to create" from RFCs
