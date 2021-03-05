# Meta
[meta]: #meta
- Name: RFC Issue Generation
- Start Date: 2020-03-03
- Author(s): @jromero
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

This RFC proposes additional information to be added to the RFC template that would be filled out during the RFC process.
This information would later be used by automation to generate issue in the appropriete repositories.

# Definitions
[definitions]: #definitions

- [RFC](https://github.com/buildpacks/rfcs/blob/rfc-issue-generation/text/0004-rfc-process.md#what-it-is) - The formal process of recording and collecting input for proposed changes.
- [Repositories](https://github.com/buildpacks) - The code repositories maintained by the Cloud Native Buildpacks project.
- [Maintainers](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#maintainers) - Individuals with elevated responsibilities regarding the day-to-day operations of any given sub-team.

# Motivation
[motivation]: #motivation

The current RFC process [requires labels for individual sub-teams of relevance to be added](https://github.com/buildpacks/rfcs/blob/main/text/0059-label-rfcs.md).
Later, after the RFC has been approved, it requires maintainers of affected sub-teams to create issues on their respective repositories.
This typically happens days, weeks, if not months after the maintainers might have reviewed the RFC.
In addition, it usually requires the person merging the RFC to hunt down (or ping) any maintainers for sub-teams that haven't created relevant issues.

The goal of this RFC is to minimize the overhead of creating issues for maintainers and the individual merging the RFCs by incoorporating the processes into the review process as opposed to the merge process.

# What it is
[what-it-is]: #what-it-is

The proposal would be to add the following information to the end of the RFC template:

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

During the review process, as maintainers review the RFC they can [suggest changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#adding-line-comments-to-a-pull-request) to this section by adding a line in the following format:

```
- <repo>: <title> [labels]...
```

Once, the RFC is approved and ready to merge the [`merge-rfc.sh`](https://github.com/buildpacks/rfcs/blob/main/merge-rfc.sh) can parse the list in this section and create the respective issues.

# Drawbacks
[drawbacks]: #drawbacks

<!--
Why should we *not* do this?
-->

- The RFC author is required to accept the suggested changes, preferably with proper DCO signatures. This would be adding a bit of toil on the authors behalf.

# Alternatives
[alternatives]: #alternatives


### Use comments instead

Instead of maintainers creating "suggested edits" to the RFC which then require the author to merge with proper DCO signing, 
the maintainers could simply comment on the RFC. Once the RFC is merged the [`merge-rfc.sh`](https://github.com/buildpacks/rfcs/blob/main/merge-rfc.sh) script could detect issues by looking through the comments.

```text
FORMAT:
  - /add-issue <repo>: <title> [labels]...
  - /remove-issue <permalink-to-comment>
```

Examples:

```text
/add-issue buildpacks/pack: implement this feature [good first issue]
```

```text
/remove-issue https://github.com/... 👈 link to comment
```

##### Pros

- No need for maintainers to suggest edits and ensure author adds issues.

##### Cons

- No call-to-action for maintainers. The maintainers would have to remember to do this during their review.

### Keep management of issues seperate

Find an alternative location to store pending issues to create.

Examples:

  - Google Sheets
  - Seperate Repository

##### Pros

- No need for maintainers to suggest edits and ensure author adds issues.

##### Cons

- Location of issue "management" is distant from RFC making it hard to trace or more tedious to work with.

# Prior Art
[prior-art]: #prior-art

None

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None

# Spec. Changes
[spec-changes]: #spec-changes

None

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
- buildpacks/rfcs: Create issues from RFCs (merge-rfc.sh)
