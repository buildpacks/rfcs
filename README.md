# RFCs for the Cloud Native Buildpacks project

Want to suggest a change to the Cloud Native Buildpacks project? Awesome!

We follow an RFC (Request for Comments) process for substantial changes to the project.
This process was originally described in the [RFC RFC](./text/0004-rfc-process.md) and is copied below:

## RFC Process

To get an RFC into Cloud Native Buildpacks, first the RFC needs to be merged into the RFC repo. Once an RFC is merged, it's considered 'active' and may be implemented to be included in the project. These steps will get an RFC to be considered:

- Fork the RFC repo: <https://github.com/buildpacks/rfcs>
- Copy `0000-template.md` to `text/0000-my-feature.md` (where 'my-feature' is descriptive. don't assign an RFC number yet).
- Fill in RFC. Any section can be marked as "N/A" if not applicable.
- Submit a pull request. The pull request is the time to get review of the proposal from the larger community.
- Build consensus and integrate feedback. RFCs that have broad support are much more likely to make progress than those that don't receive any comments.

Once a pull request is opened, the RFC is now in development and the following will happen:

- It will be labeled and discussed on a future working group meeting. Working group meetings happen on a weekly cadence barring exceptions. Labeling marks a RFC as general or specific to a subteam.
- The team will discuss as much as possible in the RFC pull request directly. Any outside discussion will be summarized in the comment thread.
- When deemed "ready", a team member will propose a "motion for final comment period (FCP)" along with a disposition of the outcome (merge, close, or postpone). This is step taken when enough discussion of the tradeoffs have taken place and the team is in a position to make a decision. Before entering FCP, super majority of the team must sign off.
- The FCP will last 7 days. If there's unanimous agreement among the team the FCP can close early.
- For voting, the binding votes are comprised of the core team (and subteam maintainers if labeled as a subteam RFC). Acceptance requires super majority of binding votes in favor. The voting options are the following: Affirmative, Negative, and Abstinence. Non-binding votes are of course welcome. Super majority means 2/3 or greater and no single company can have more than 50% of countable votes.
- If no substantial new arguments or ideas are raised, the FCP will follow the outcome decided. If there are substantial new arguments, then the RFC will go back into development.

Once an RFC has been accepted, the team member who merges the pull request should do the following:

- Assign an id based off the pull request number.
- Rename the file based off the id inside `text/`.
- Create a corresponding issue in the appropriate repo.
- Fill in the remaining metadata at the top.
- Commit everything.
