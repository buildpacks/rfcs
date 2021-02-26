# Cloud Native Buildpacks RFCs - [Active RFCs](https://github.com/buildpacks/rfcs/pulls?q=is%3Apr+is%3Aopen+archived%3Afalse+-label%3Ahold+draft%3Afalse), [Finalizing RFCs](https://github.com/buildpacks/rfcs/pulls?q=is%3Apr+is%3Aopen+archived%3Afalse+label%3A%22Final+Comment+Period%22+draft%3Afalse+)

Want to suggest a change to the Cloud Native Buildpacks project? Awesome!

We follow an RFC (Request for Comments) process for substantial changes to the project.
This process was originally described in [RFC 0004](./text/0004-rfc-process.md) and was amended in:
* [RFC 0029](./text/0029-template-changes.md)
* [RFC 0033](./text/0033-add-author.md)
* [RFC 0059](./text/0059-label-rfcs.md)
* [RFC 0060](./text/0060-create-repo-issues.md)

## RFC Process

### Proposal
To get a proposal into Cloud Native Buildpacks, first, an RFC needs to be merged into the RFC repo. Once an RFC is merged, it's considered 'active' and may be implemented to be included in the project. These steps will get an RFC to be considered:

1. Fork the RFC repo: <https://github.com/buildpacks/rfcs>
1. Copy `0000-template.md` to `text/0000-my-feature.md` (where 'my-feature' is descriptive. don't assign an RFC number yet).
1. Fill in RFC. Any section can be marked as "N/A" if not applicable.
1. Submit a pull request. The pull request is the time to get review of the proposal from the larger community.
1. Build consensus and integrate feedback. RFCs that have broad support are much more likely to make progress than those that don't receive any comments.

### Development
Once a pull request is opened, the RFC is now in development and the following will happen:

1. The following labels will be applied as appropriate:
 * `spec/<spec>` - For example, an RFC proposing a change to the Platform Specification will be labeled with `spec/platform`.
 * `audience/<audience>`- For example, an RFC proposing a new pack feature for buildpack authors will be labeled with `audience/buildpack-author`
1. It will be discussed in a future [working group meeting](https://github.com/buildpacks/community#working-group). Working group meetings happen on a weekly cadence barring exceptions.
1. The team will discuss as much as possible in the RFC pull request directly. Any outside discussion will be summarized in the comment thread.
1. When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition of the outcome (merge, close, or postpone). This is step taken when enough discussion of the tradeoffs have taken place and the team is in a position to make a decision. Before entering FCP, super majority of the team must sign off.

### Final Comment Period
When a pull request enters FCP the following will happen:
1. A team member will apply the "Final Comment Period" label.
1. The FCP will last 7 days. If there's unanimous agreement among the team the FCP can close early.
1. For voting, the binding votes are comprised of the core team (and subteam maintainers if labeled as a subteam RFC). Acceptance requires super majority of binding votes in favor. The voting options are the following: Affirmative, Negative, and Abstinence. Non-binding votes are of course welcome. Super majority means 2/3 or greater and no single company can have more than 50% of countable votes.
1. If no substantial new arguments or ideas are raised, the FCP will follow the outcome decided. If there are substantial new arguments, then the RFC will go back into development.

### Merge
Once an RFC has been accepted, the sub-team maintainers should:
1. Create issues [referencing](https://docs.github.com/en/github/writing-on-github/autolinked-references-and-urls#issues-and-pull-requests) the RFC PR.
1. Label the PR with `issues-created/<sub-team>` after issues have been created or if zero issues necessary for a given sub-team.

Once an `issues-created/<sub-team>` label has been created for each sub-team, the RFC is ready to merge. The team member who merges the pull request should do the following:

1. Assign an id based off the pull request number.
1. Rename the file based off the ID inside `text/`.
1. Fill in the remaining metadata at the top.
1. Commit everything.
1. Update issues with RFC ID and a link to the text file.
1. Update any links in PR description to point at the committed file.
1. Remove the "Final Comment Period" label.

## Automation

The `merge-rfc.sh` script automates several steps of the merge process for accepted RFCs. The following will assign an ID, update the RFC metadata with references to the PR and created issues, and merge an RFC to the `main`.
```
./merge-rfc.sh [-i <issue>...] [-n] <PR#>
```
Each `<issue>` should be of the form `<org>/<repo>#<number>` (e.g. `buildpacks/spec#1`). In the rare case that no work must be done in the project as a result of the RFC pass the `-n` flag to explicitly indicate that no issues should be linked.

After running the `merge-rfc.sh` script, manually verify the output before pushing changes.
