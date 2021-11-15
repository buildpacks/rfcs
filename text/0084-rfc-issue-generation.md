# Meta
[meta]: #meta
- Name: RFC Issue Generation
- Start Date: 2020-03-03
- Author(s): @jromero
- Status: Approved
- RFC Pull Request: [rfcs#141](https://github.com/buildpacks/rfcs/pull/141)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/rfcs#158](https://github.com/buildpacks/rfcs/issues/158)
- Supersedes: "N/A"

# Summary
[summary]: #summary

This RFC proposes an automated mechanism for generating issues for the appropriete repositories from RFCs during the RFC process.

# Definitions
[definitions]: #definitions

- _Bot_ - The GitHub account used to run automated actions.
- [RFC](https://github.com/buildpacks/rfcs/blob/rfc-issue-generation/text/0004-rfc-process.md#what-it-is) - The formal process of recording and collecting input for proposed changes.
- [Repositories](https://github.com/buildpacks) - The code repositories maintained by the Cloud Native Buildpacks project.
- [Maintainers](https://github.com/buildpacks/community/blob/main/GOVERNANCE.md#maintainers) - Individuals with elevated responsibilities regarding the day-to-day operations of any given sub-team.
- Queued Issues - A list of issues to be created when the RFC is merged.

# Motivation
[motivation]: #motivation

The current RFC process [requires labels for individual sub-teams of relevance to be added](https://github.com/buildpacks/rfcs/blob/main/text/0059-label-rfcs.md).
Later, after the RFC has been approved, it requires maintainers of affected sub-teams to create issues on their respective repositories.
This typically happens days, weeks, if not months after the maintainers might have reviewed the RFC.
In addition, it usually requires the person merging the RFC to hunt down (or ping) any maintainers for sub-teams that haven't created relevant issues.

The goal of this RFC is to minimize the overhead of creating issues for maintainers and the individual merging the RFCs by incorporating the processes into the review process as opposed to the merge process.

# What it is
[what-it-is]: #what-it-is

This solution is comprised of a _bot_ (a faux GitHub account) and updates to the [`merge-rfc.sh`](https://github.com/buildpacks/rfcs/blob/main/merge-rfc.sh) script. The bot, likely to be implemented via GitHub Actions, monitors pull requests in `buildpacks/rfcs` for comments while maintaining a list of _queued issues_. `merge-rfc.sh` would be updated to parse the list of queued issues and create those issues in their respective repositories.

# How it Works
[how-it-works]: #how-it-works

When a pull request is created on `buildpacks/rfcs` the bot would post a comment with the following content:

>
> Maintainers,
>
> As you review this RFC please queue up issues to be created using the following commands:
>
>  - `/queue-issue <repo> "<title>" [labels]...`
>  - `/unqueue-issue <uid>`
>
> **Queued Issues**
> 
> _(none yet)_
>

The bot will monitor comments to pull requests. It will parse the contents in search for instructions `/queue-issue` or `/unqueue-issue`. If found, it would take the approprite action by updating the initial comment posted with a list of queued issues. In the case of an addition a short UID would be generated.

#### Example Addition

Addition Comment:

```
/queue-issue buildpacks/rfcs "Create issues from RFCs (merge-rfc.sh)" [label1][label2]
```

Updated Bot Comment:

>
> Maintainers,
>
> As you review this RFC please queue up issues to be created using the following commands:
>
>  - `/queue-issue <repo> "<title>" [labels]...`
>  - `/unqueue-issue <uid>`
>
> **Queued Issues**
> 
> - Xoq7ID - buildpacks/rfcs "Create issues from RFCs (merge-rfc.sh)" [label1][label2]
>


#### Example Removal

Remove Comment:

```
/unqueue-issue Xoq7ID
```

Updated Bot Comment:

>
> Maintainers,
>
> As you review this RFC please queue up issues to be created using the following commands:
>
>  - `/queue-issue <repo> "<title>" [labels]...`
>  - `/unqueue-issue <uid>`
>
> **Queued Issues**
> 
> _(none)_
>

Once the RFC is merged via the [`merge-rfc.sh`](https://github.com/buildpacks/rfcs/blob/main/merge-rfc.sh) script, the script could detect issues by looking through the top comment from the _bot_ and creating any queued issues. Some additions that the script may do but subject to change:

- Prepend `[RFC #<number>]` to issue titles.
- Append link to Pull Request to issue description.
- Add additional labels.

# Drawbacks
[drawbacks]: #drawbacks

The following are pros and cons as compared to alternative solutions.

##### Pros

- No need for maintainers to suggest edits and ensure author adds issues.

##### Cons

- Added complexity of implementing and maintaining a bot.

# Alternatives
[alternatives]: #alternatives


### Add markdown to RFC template

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

During the review process, as maintainers review the RFC they can [suggest changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#adding-line-comments-to-a-pull-request) to this section by adding a line in the following format:

```
- <repo>: <title> [labels]...
```

Once, the RFC is approved and ready to merge the [`merge-rfc.sh`](https://github.com/buildpacks/rfcs/blob/main/merge-rfc.sh) can parse the list in this section and create the respective issues.


##### Pros

- Minimal additional implementation complexity.

##### Cons

- The RFC author is required to accept the suggested changes, preferably with proper DCO signatures. This would be adding a bit of toil on the authors behalf.

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

- [prow](https://github.com/kubernetes/test-infra/tree/master/prow) - A heavy-weight k8s automation system used largely by the k8s ecosystem to automate certain aspects of the review process using "chat-ops" (`/test`, `/approve`, `/assign` comments).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should these operations be restricted to users that are in `@buildpacks/*-maintainer` groups? Maybe expand it to `@buildpacks/*-contributors`?

# Spec. Changes
[spec-changes]: #spec-changes

None
