# Meta
[meta]: #meta
- Name: Steering Committee
- Start Date: 2026-06-18
- Author(s): @hone
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes restructuring the Technical Oversight Committee (TOC) into a Steering Committee (SC) focused on strategic governance, and formally establishing the Project Maintainers as the collective body owning technical specifications and implementation. The proposal expands the Steering Committee to five seats: three Maintainers elected by the maintainers, and two End-Users representing organizations listed in `ADOPTERS.md`, appointed via lazy consensus. Finally, it enforces a strict 50% corporate representation cap on the Steering Committee, including a circuit breaker to temporarily make excess corporate seats non-voting in the event of vacancies.

# Definitions
[definitions]: #definitions

* **Steering Committee (SC):** The governing body responsible for non-technical strategy, branding, CNCF relations, and community health.
* **Project Maintainers:** The collective body of all active Maintainers and Team Leads across all sub-teams, responsible for specifications, architecture, and RFC approvals.
* **Maintainer Seat:** A seat on the SC elected from and by the active project maintainers.
* **End-User Seat:** A seat on the SC appointed to represent organizations using Cloud Native Buildpacks in production.

# Motivation
[motivation]: #motivation

As part of our CNCF graduation journey, we need to address single-vendor representation concerns on our Technical Oversight Committee (TOC). Currently, two of the three active TOC members are employed by Salesforce/Heroku. This happened due to people changing jobs and not having the same amount of time making the current corporate representation lopsided. While our bylaws cap company representation at 50% of total seats, active vacancies mean a single vendor holds a 2/3 majority of active voting power on paper. This concentration creates a graduation blocker under CNCF's vendor-neutrality rules.

Beyond unblocking vendor-neutrality requirements, this restructuring aims to enrich the project by bringing diverse viewpoints directly into project leadership, specifically from active end users. While prioritizing the perspectives of active code contributors has successfully driven the project's engineering to date, we want to formally represent the voices of organizations running Buildpacks at scale in production. These end-users may not have the cycles to contribute code daily, yet Buildpacks forms a core part of their internal developer platforms. Elevating these voices to the Steering Committee ensures project strategy remains closely aligned with real-world production needs.

To resolve this, we want to split strategic project governance from daily technical execution. By renaming the TOC to the Steering Committee, expanding its seats to dilute single-vendor concentrations, and delegating all technical authority to the active project maintainers, we establish a clear, vendor-neutral governance structure without introducing heavy administrative overhead.

# What it is
[what-it-is]: #what-it-is

This proposal reorganizes our project governance by separating strategic, non-technical oversight (strategy, licensing, trademark, CNCF interface) from daily technical execution (specifications, code, releases).

### 1. Steering Committee vs. Project Maintainers
* **Steering Committee (SC):** Replaces the TOC. Focuses on non-technical governance, CNCF relations, trademark, and mediating unresolved technical deadlocks.
* **Project Maintainers:** Composed of all active Maintainers and Team Leads across our sub-teams (Platform, Implementation, Learning, Tooling). They retain absolute autonomy over specification changes, architecture, roadmaps, and RFC approvals.

#### Splitting the Current TOC Responsibilities
To ensure absolute clarity, the ten core mandates historically assigned to the TOC under our bylaws will be partitioned as follows:

| Old TOC Responsibility | New Steering Committee (SC) Role | Project Maintainers Role |
| :--- | :--- | :--- |
| **Bylaws & Structure** | Owns defining and updating the project's governance structure (`GOVERNANCE.md`). | Consulted on structural changes. |
| **Community & Conduct** | Fosters a healthy, welcoming community and enforces the Code of Conduct. | N/A |
| **Vendor Neutrality** | Safeguards and audits project-wide vendor neutrality. | N/A |
| **CNCF Relations & Brand** | Represents the project to the CNCF (e.g., annual reviews, graduation) and oversees trademark and branding. | N/A |
| **Team Management** | Administers creating, reorganizing, or dissolving sub-teams. | Consulted on and co-signs team changes. |
| **Appointing Team Leads** | Formally appoints Team Leads nominated by their respective teams. | N/A (Sub-teams run their own nominations). |
| **Technical Vision & Spec** | N/A | Owns defining and maintaining the specifications and core API contracts. |
| **Technical RFC Process** | N/A | Owns stewarding and approving/rejecting technical and architectural RFCs. |
| **Annual Roadmap** | N/A | Establishes the annual technical roadmap and objectives. |
| **General Catch-All** | Resolves technical deadlocks escalated by the Project Maintainers; handles anything else that falls through the cracks. | N/A |

### 2. The 3+2 Seat Model
The Steering Committee will consist of 5 voting seats:
* **3 Maintainer Seats:** Elected by the active maintainer pool from among active maintainers.
* **2 End-User Seats:** Appointed by the active maintainer pool to represent organizations using Buildpacks in production.

#### Term Lengths and Limits
* **Term Length:** The standard term for all Steering Committee seats is **two years**.
* **Staggering:** Terms are staggered to ensure continuity. Under normal operations, elections and appointments will occur annually, staggering the seats so that approximately half of the committee faces election or appointment each year.
* **Term Limits:** There are **no term limits**; members may serve consecutive terms if re-nominated and re-elected or re-appointed by the maintainer pool.

### 3. End-User Criteria
Candidates for the End-User seats must represent an organization listed in the project's `ADOPTERS.md` file. If their organization is not yet listed, they must submit a PR to add themselves to `ADOPTERS.md` as part of the nomination process.

### 4. Candidate Profiles
If a vote is triggered (more candidates than open seats), candidates are required to post a crisp 1–2 sentence statement directly in the election issue thread explaining who they are and why they are running.

# How it Works
[how-it-works]: #how-it-works

### 1. Corporate Representation Cap
* At no time shall individuals employed by the same corporate entity (including its affiliates and subsidiaries) occupy more than 50% of the total seats on the Steering Committee.
* **Active Seat Circuit Breaker:** No single corporate entity may hold a majority of the active, filled voting seats on the Steering Committee. In the event that vacancies or job changes cause a single organization to exceed this limit, the excess seat(s) from that organization shall temporarily become non-voting until balance is restored.

### 2. Elections and Appointments on GitHub
All governance actions will be managed in the `buildpacks/community` repository using standard Issue and PR workflows. Each election is coordinated by one or more election leads appointed by the Steering Committee who are not candidates in that election (typically a non-running Steering Committee member or a designated neutral contributor).

* **Maintainer Elections:**
  1. A GitHub Issue labeled `type:election` and `steering` is opened by the election lead(s).
  2. **Nomination Phase (7 days):** Any active maintainer can comment to nominate a peer or self-nominate.
  3. **Short-Circuit:** If the number of nominees is less than or equal to the number of open seats, they are automatically appointed (subject to the corporate cap) and no vote is run.
  4. **Voting Phase (7 days):** If contested, candidates post a 1-2 sentence profile statement, and maintainers vote asynchronously on the issue. The candidate with the highest vote count wins.
* **End-User Appointments:**
  1. A maintainer opens a PR against `buildpacks/community` updating `TEAMS.md` or `STEERING.md` with the nominee's details.
  2. The PR description links to the nominee's 1-2 sentence statement.
  3. The PR is open for 7 days. Appointment is finalized via lazy consensus.

### 3. Handling Vacancies
If a Steering Committee member steps down or is inactive (unresponsive for 3 consecutive months):
* **Maintainer Seat:** A special election is conducted on the `community` repository using the same GitHub Issue process. The newly elected member will serve for the **remainder of the vacated term** to preserve the staggering cycle.
* **End-User Seat:** The Project Maintainers will nominate and appoint a replacement via the standard PR lazy-consensus process to serve for the **remainder of the vacated term**.

### 4. Tie-Breakers
* **Elections:** In the event of a tie for an open seat, the winner will be determined by a coin flip conducted by the election lead(s).
* **Committee Votes:** If a Steering Committee vote on a proposal or resolution ends in a tie, the motion fails.

### 5. Transition Plan
* The current active TOC members will transition to become the founding members of the Steering Committee.
* The active Project Maintainers across all sub-teams retain full ownership over technical direction.
* The Maintainer Pool will appoint the 2 End-User representatives within 60 days of this RFC's adoption.
* To bootstrap the staggering cycle, one Maintainer seat and one End-User seat will exceptionally serve an initial 1-year term, while the remaining seats will serve standard 2-year terms. The founding Steering Committee members will determine by mutual agreement which Maintainer seat will serve the initial 1-year term.

# Migration
[migration]: #migration

This change does not break public APIs or compatibility of the buildpack lifecycle or platforms. It changes our project bylaws, meaning once this RFC is accepted:
1. A Pull Request will be submitted to the `buildpacks/community` repo updating `GOVERNANCE.md` and adding `STEERING.md` to record the committee roster.
2. The initial election/appointment process for End-Users will be kicked off.

# Drawbacks
[drawbacks]: #drawbacks

* Expanding the committee from 3 active members to 5 seats requires finding 2 qualified end-user representatives. However, tying this to `ADOPTERS.md` provides a clear and motivated pool of candidates.

# Alternatives
[alternatives]: #alternatives

* **Keep the current TOC and recruit independent members:** Finding individual independents who are not associated with our main corporate sponsors and getting them to commit to governance without representing end-user platforms is much harder than appointing motivated end-users.
* **Complex democratic elections:** Running public, community-wide campaigns with voter registration introduces massive overhead and is unnecessary for a project of our size.

# Prior Art
[prior-art]: #prior-art

* **Knative:** Separates their Steering Committee (KSC) for organizational governance from the Technical Oversight Committee (TOC) for architecture and specifications. See the [Knative Governance Charter](https://github.com/knative/community/blob/main/GOVERNANCE.md).
* **Helm:** Uses Org Maintainers (governance) and Project Maintainers (sub-projects), with elections held peer-to-peer. See the [Helm Governance Charter](https://github.com/helm/community/blob/main/governance/governance.md).
* **Kubernetes:** Uses a Steering Committee for organizational and bylaws governance, delegating technical execution to SIGs. See the [Kubernetes Governance Charter](https://github.com/kubernetes/community/blob/master/governance.md).
* **Kubernetes/Knative Election Tie-Breakers:** Both projects explicitly specify using a coin flip as their official tie-breaker for steering elections (see the [Knative Election Procedures](https://github.com/knative/community/tree/main/elections)).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

