# Meta
[meta]: #meta
- Name: CNB User Research 2021
- Start Date: 2020-12-10
- Author(s): sampeinado, speinado@vmware.com
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Background
The purpose of this study is to understand the major pain points buildpack authors and app developers experience in using Cloud Native Buildpacks and how these issues slow the adoption of CNBs as an emerging standard in containerization. VMware has donated funding for the recruitment and compensation of 15-20 interview subjects to help the CNB project grow. 
 
Given our contributors’ strong understanding of buildpacks and their spec, the project is at risk of a blindspot towards novice buildpack authors who want to create value quickly. The CNB spec enables more modularity than the v2 spec, but its API is also significantly more complex. For our ecosystem of buildpacks to grow, and therefore the number of app types and use cases buildpacks support to grow, we need to develop a better understanding of where buildpack authors struggle and how we can support them. 
 
In addition, we want to better understand why app developers switch to CNBs and what challenges they face when doing so. As a project, we have clear assumptions about why CNBs are valuable relative to other containerization tools, but we don’t know which reasons are most important to which users. Without this clarity, our ability to market the project’s strengths and prioritize the most valuable features is limited. 

# Objectives
<ol>
<li>Understand how buildpack authors currently go about writing buildpacks and customizing builds and what goals they are trying to accomplish by doing so</li>
<ol>
<li>Evaluate pain points buildpack authors are experiencing </li>
<li>Evaluate the relative usability of proposals like [packfile](https://github.com/sclevine/packfile) or [inline buildpacks](https://github.com/kr/heroku-buildpack-inline) </li>
</ol>
<li>Define the different segments of app developers using buildpacks, their goals, challenges, and motivations to switch to buildpacks from other tools</li>
<ol>
<li>Identify a tipping point at which users can be considered “converted”</li>
<li>Enable us to become more strategic in our communication in conference talks, blog posts, and working group </li>
</ol>
<li>Provide survey responses to key topics the project is currently working on</li>
<ol>
<li>How and where they find information today</li>
<li>Which platforms they use CNBs on</li>
<li>Expectations around inner loop development</li>
</ol>
<li>Anti-goals</li>
<ol>
<li>Who’s using what buildpacks brand</li>
<li>Usability of the `pack` CLI, except as it relates to buildpack authorship</li>
<li>Challenges of platform implementors integrating the lifecycle</li>
<li>Challenges of platform operators doing governance</li> 
</ol>
</ol>

# Process
**Timeline:** 
November 1, 2020 - February 28, 2021 (completed before Buildpacks Summit in the spring)
 
**Checkpoints:**
- ☑️ Create initial proposal for funding - Nov 2020
- ☑️ Review existing documents - summary [doc](https://docs.google.com/document/d/1gEVCykAN2j4Ha6NzwHt1m5J1Jtdh16Riio1w3me7peY/edit#)  - Nov 2020
- ☑️ Conduct SME interviews - folder [link](https://drive.google.com/drive/folders/1Z7eTLzfdS7JvV6UQXG-1PiZdOevUNqNa) - Nov 2020
- ☑️ Define research participants - screener survey [doc](https://docs.google.com/document/d/12PQsupIn3I50xC0AzC3ouLKY10V8KpbYh8Vnh8jiK6s/edit) - Dec 2020
- ☐ Write script for first round - script [doc](https://docs.google.com/document/d/1rn7ojSXJNbYSzn8p4kaLNGFkT_5Q_zeD03cdZ5h-JlM/edit) - Dec 2020
- ☐ Conduct 10-15 interviews with app developers about benefits and tradeoffs of buildpacks - Jan 2021
- ☐ Review and synthesize interview findings -  findings [doc](https://docs.google.com/document/d/1anR_uma7ajr51xfvZAJsSSE5P2-bjPlL6EEBWz8pfTQ/edit#heading=h.7uxlulg7055g) - Jan + Feb 2021
- ☐ Review findings with contributors and edit script - Jan 2021
- ☐ Conduct 5-7 usability tests of simple buildpack authorship - list of authors [doc](https://docs.google.com/document/d/12PQsupIn3I50xC0AzC3ouLKY10V8KpbYh8Vnh8jiK6s/edit) - Feb 2021
- ☐ Conduct survey - Feb 2021
- ☐ Review and synthesize usability findings -  findings [doc](https://docs.google.com/document/d/1anR_uma7ajr51xfvZAJsSSE5P2-bjPlL6EEBWz8pfTQ/edit#heading=h.7uxlulg7055g) - Feb + Mar 2021
- ☐ Present findings to contributors - Mar 2021
- ☐ Conduct follow up usability tests with resulting authorship solutions - April (?) 2021


# Participants
- App developers currently using buildpacks 
- App developers currently using dockerfiles or another container build technology
  - A representative slice not a specific subset 
- Buildpack authors, or proxies, like:
  - Senior Dev Ops folks / engineering leads who have a holistic sense of their project
  - People maintaining a “blessed” base image to use with Dockerfiles
  - Developer enablement teams (platform teams)


# Collaborators
- Technical Recruiting Partner: [gotomedia](https://www.gotomedia.com/)
- Co-Researcher and Engineering Advisor: Natalie Arellano (VMware + CNB)
- Supporting Researchers: Megan Taylor (VMware)
- Supporting interviewers and notetakers: Sophie Wigmore (VMware + Paketo), Josh Zarrabi(VMware + Paketo), and Daniella Corricelli (VMware + Paketo)
 
And always looking for more! Just leave a comment if you’d like to get involved :)

# References
Existing knowledge summary [doc](https://docs.google.com/document/d/1gEVCykAN2j4Ha6NzwHt1m5J1Jtdh16Riio1w3me7peY/edit#) (AKA our assumptions)
Initial brainstorm with CNB contributors [doc](https://docs.google.com/document/d/1IqFLsLbVucqi3JnzEeliLZKQwTUe4GdHXk1PrpNqRb0/edit#)
