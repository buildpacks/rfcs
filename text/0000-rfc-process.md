# Meta
[meta]: #meta
- Name: RFC Process
- Start Date: 2021-05-10
- Author(s): [@ekcasey](https://github.com/ekcasey)
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: [RFC 0004](0004-rfc-process.md)

# Summary
[summary]: #summary

The "RFC" (request for comments) process provides a consistent and controlled path for new features and other substantive changes to enter the project.

The RFC process:
* provides a set of checkpoints that ensure changes align with the overall technical and strategic vision for the process.
* ensures the motivation for a change is clear.
* ensures the impact of a change on users is clear and migration path and backwards compatibility are considered.
* aligns stakeholders on any changes to the user interface(s) and/or APIs (e.g. pack user interface, platform API, buildpack API).
* aligns stakeholders on any substantive architectural changes.
* aligns stakeholders on any processes or workflows adopted by the project.
* provides visibility to the community regarding ongoing work and upcoming changes.
* provides a mechanism by which any interested party can provide early feedback on an upcoming change.
* provides a version controlled record of our decisions and the thought-process behind them.
* is open to anyone! We enthusiastically welcome RFCs from authors that have no formal role in project governance (yet ;p).

The RFC process **is not**:
* a replacement for high-quality user-facing documentation(although high-quality RFCs enable the creation of high-quality documentation).
* a transaction log of changes. Readers should be able to understand the change proposed without undue reference to previous RFCs.
* a feature request process. RFCs require a level of design and implementation detail that goes beyond a feature request. Pure feature requests should instead be initiated as discussions on the community repo, issues on this repo, or issues on component repos. These requests may serve as the motivation for future RFCs.


# Definitions
[definitions]: #definitions

**Technical Oversight Committee**: The governing body responsible for overseeing the project as described in our governance document.

**Team**: A group responsible for a particular area of the project.

**Team Lead**: A team maintainer with special responsibilities for representing the concerns of a team to the project, including casting binding votes on project RFCs.

**RFC**: A document proposing a substantive change to the project as described in this document.

**Project RFC**: An RFC with cross-cutting implications, requiring collaboration between multiple teams or affecting multiple personas.

**Team RFC**: An RFC with narrower implication in comparison to a project RFC, with work scoped to a single team and implications for a narrower set of personas.

**Author**: The author or authors of an RFC are responsible for producing the draft RFC and updating it to incorporate feedback. Changes should not be made to a draft RFC without the author's consent.

**Steward**: The steward of an RFC is responsible for shepherding an RFC through the process, including working with the author to ensure RFC completeness and quality, and building consensus among stakeholders.

**Call for Votes**: When an RFC is deemed ready by a team lead, that team lead initiates the voting process with a call for votes. At this point the RFC is closed to modification.

**End Date**: When a call for votes is initiated, an end date for voting is set. Any person wishing to vote on an RFC must do so by the end date.

**Voting Window**: The time period between a call for votes and the voting end date is referred to as the voting window.

**Lazy Consensus**: Voting on RFCs is done by lazy consensus. Any project member with a binding vote who has not voted by the end date is assumed to assent to the RFC.

**Binding Vote**: Binding Votes have formal power within the RFC process. A single no vote by a project member with a binding vote is sufficient to reject an RFC.

**Non-Binding Vote**: Anyone from the project or community may cast a non-binding vote on an RFC to express their position. While these votes do not have formal power they are taken seriously and may affect the votes of members with binding votes.


# Motivation
[motivation]: #motivation

This RFC process is an evolution of our [previous process](0004-rfc-process.md).

As the project grows our process needs to grow with it. Compared to the previous iteration, this new process should:
1. **Re-balance responsibilities**. We wish to empower team leads to take ownership of the future of the project and transition the TOC into an oversight role.
2. **Favor action**. By moving from a super-majority vote to a lazy-consensus we remove the ability to block change through inaction. It is now the responsibility of those with concerns to raise them in a timely fashion.
3. **Manage our bandwidth**. Sometimes we need to say "not now" to a good idea to manage the number of large changes proceeding simultaneously. This new process should help the project focus on shipping high-quality enhancements by managing the number of in-flight RFCs, and ensuring each approved RFC has an implementer.
4. **Improve Readability**. By allowing amendments to RFCs we make life easier for anyone wishing to understand a change by ensuring they can find the full plan in a single document.

# What it is
[what-it-is]: #what-it-is

### What Types of Changes Require an RFC?

Any "substantive" change to the project should require an RFC. substantive includes but is not limited to:
* changes to the specification.
* the adoption, creation, or deprecation of a component (e.g. a new platform implementation, a new shared library, a new system buildpack). 
* new features (e.g. a new pack command, a new flag on an existing pack command, an addition to the buildpack API)
* any major refactor that affects consumers of our libraries or materially impacts contribution.
* any major re-architecture especially if it has noteworthy implications for security or performance.
* introduction of new processes or changes to our existing processes including the RFC process.

If there is any doubt, maintainers should prefer opening an "unnecessary" RFC over surprising users with unexpectedly impactful changes.

#### Project vs Team RFCs

An RFC should be a project RFC if:
* it impacts the spec.
* it introduces a new component.
* its implementation necessitates coordination across multiple teams.
* it meaningfully impacts multiple personas (e.g. buildpack authors and platform authors).
* the TOC requests that it be a project RFC.

Given the nature of our project many RFCs will happen at the project level. However, some types of changes are more appropriately scoped to the team level. Some examples include:
* Platform example: additions to or modification of the pack CLI interface (e.g. [pack pull policy](0046-pack-pull-policy.md)) or library interface (e.g. [pack logging refactor](0002-pack-logging-refactor.md)).
* BAT example: a new major version of the libcnb API.
* Implementation example: [Layer history](0102-history.md) or the lifecycle [multicall binary](0024-lifecycle-multicall-binary-for-build.md).
* Distribution example: [Update CNB Registry JSON Schema](https://github.com/buildpacks/rfcs/pull/45).
* Learning example: [intro video](0090-intro-video-script.md).

### Process

#### Requesting an RFC
If you believe an RFC should be written but are either not prepared to author it personally or not prepared to do it _now_, please open an issue on this repo with a high level description of the desired change. This helps us keep track of good ideas and match make ambitious contributors with appropriately sized challenges.

#### Drafting an RFC
All RFCs begin life as a draft. Anyone wishing to propose a change to the project should create a draft RFC by:

- Fork the RFC repo: <https://github.com/buildpacks/rfcs>
- Copy `0000-template.md` to `text/0000-my-feature.md` (where 'my-feature' is descriptive. don't assign an RFC number yet).
- Fill in RFC. Any section can be marked as "N/A" if not applicable.
- Submit a pull request.

#### Finding a Steward
All RFCs, even project RFCs "belong" to a team. For project RFCs, The team lead of the responsible team is the steward of the RFC. For team RFCs any maintainer may be the steward. The author and the steward of an RFC may, at times, be the same person.

In many but not all cases the appropriate team to own an RFC will be obvious. When the appropriate team is not obvious, the author should work with the community to find a home within one of the teams. Factors to consider when finding home include:
* Which team has the most relevant technical context?
* Which team has the deepest understanding of the use-case and the needs of impacted personas?
* Which team is responsible for the components most impacted by the proposed change?
* Which team is enthusiastic about supporting the change?

If a home cannot be found for a draft RFC it remains in draft until one can be found. This does not necessarily mean that the RFC is not a good idea or isn't something the project will take up eventually. It may simply be that the project does not have the bandwidth to prioritize this particular change at this particular time.

#### Stewardship

The steward and their team should:
 * work with the author of the RFC to ensure that the RFC is complete and implementable contingent upon approval. This can happen synchronously at team working groups or asynchronously via github and slack.
 * raise visibility to and solicit feedback from other stakeholders including the TOC, other teams, and the community at large. This can happen synchronously at the project working group and asynchronously via github and slack.
 * drive consensus for the RFC by incorporating feedback from stakeholders so that the RFC has the best possible chance of approval during the voting process.
 * ensure there is a plan in place to implement the RFC in a reasonable time frame, contingent upon approval. The team itself need not implement the RFC but we should not approve RFCs for which we have no concrete plan to implement.
 * in the case of complicated or risky RFCs, a POC should be developed at this stage to validate and de-risk the proposed design.

#### Voting

Ideally the voting should be a formality and not a moment to discover new disagreement, consensus already haven been driven by the steward.

When the steward deems the RFC ready and likely to be accepted they should formally call for votes and set an end date for voting. This process does not prescribe a length for the voting window, but stewards should make a good faith effort to ensure that all interested parties, and in particular those with binding votes, have adequate opportunity to review the finalized RFC and cast votes.

The RFC may not be edited during the voting window.

For project RFCs, all TOC members and all team leads are given a binding vote.

Additionally, for team RFCs, all team maintainers are given a binding vote.

Votes are cast via reviews on the RFC PR. Accepting the PR signifies a yes vote while a request for changes signifies a no vote. If all members with a binding vote vote in the affirmative, the voting window may close early.

##### Acceptance

If the end date of the vote arrives without a no vote from a member with binding vote, the RFC is accepted. It will be merged into the repo and assigned a number. The steward should create a tracking issue to coordinate implementation and link the tracking issue in the RFC header. When this is complete, implementation can begin.

##### Rejection

If a single no vote from a member with binding vote is cast before the arrival of the end date the RFC is immediately rejected and the PR should be closed.

The same RFC may be re-opened and brought to a vote again in the future assuming the concerns that lead to the no vote are addressed.

##### Implementation

##### Amending an RFC

While we should strive to get the details right the first time, by doing our due diligence including a proof of concept implementation for larger/riskier RFCs, there will be times when we discover during the process of implementation that something about the original plan was incomplete or needs adjustment. Small changes may be PR'ed by the implementer and merged upon approval by the steward. It is the responsibility of the Steward to determine what changes are minor enough to qualify as an amendment and which are fundamental and/or controversial enough to require a new superseding RFC.

PRs that amend an RFC should add an amendment to the [History](../0000-template.md#history) section of the RFC document with:
1. Amendment Metadata
2. A summary of the changes
3. The motivation for the changes


### Amending the RFC Process

The RFC process should be amended through the RFC process. However, the TOC reserves the right to change the process via a super-majority vote in the unlikely even that the process prove so irreparably flawed as to preclude its amendment via the process.

# How it Works
[how-it-works]: #how-it-works

### Labels

| name                      | purpose
|---------------------------|--------
| `type/idea`               | An Issues requesting an RFC
| `type/rfc`                | A PR containing a new RFC
| `type/tracking`           | An issue tracking the implementation of an RFC
| `type/ammendment`         | A PR containing an ammendment to an existing RFC
| `scope/project`           | Applied to project-level RFCs
| `scope/team`              | Applied to team-level RFCs.
| `team/<team name>`        | E.g `team/platform`. Designates the team that "owns" an RFC. Applies to both team-level and project-level RFCs. For project-level RFCs the lead of this team is the steward.
| `status/needs-steward`    | Applied to all new RFCs. Removed once the RFC is accepted by a steward or closed.
| `status/ready-for-review` | The Steward applies this to an RFC when they deem it ready for review by a broader audience.
| `status/voting`           | The Steward applies this label when the voting window opens
| `status/accepted`         | The Steward applies this label to accepted RFCs.
| `status/rejected`         | The Steward applies this label to rejected RFCs.

# Migration
[migration]: #migration

This RFC should be accepted via the existing RFC process. The new process will take effect immediately after its ratification, superseding in its entirety the previous process.

# Drawbacks
[drawbacks]: #drawbacks

None

# Alternatives
[alternatives]: #alternatives

None

# Prior Art
[prior-art]: #prior-art


* [Tekton Enhancement Proposal Process (TEP)](https://github.com/tektoncd/community/blob/main/teps/0001-tekton-enhancement-proposal-process.md)
* [Kubernetes Enhancement Proposals (KEP)](https://github.com/kubernetes/enhancements/blob/master/keps/README.md)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A
