# Meta
[meta]: #meta
- Name: Label RFCs With Specification And Target Audience
- Start Date: 2020-08-15
- Author(s): ForestEckhardt
- Status: Approved
- RFC Pull Request: [rfcs#108](https://github.com/buildpacks/rfcs/pull/108)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (N/A)

# Summary
[summary]: #summary

It would be nice to start labeling RFCs with a label that indicates which part
of the specification (i.e. Buildpack Interface, Distribution, Platform
Interface) is being affected as well as a label to indicate the target audience
(i.e. Buildpack Authors, CNB Contributors, Platform Operators) of the change.

# Motivation
[motivation]: #motivation

Indicating which part of the specification the RFC is purposing to update or
modify will make the RFC more discoverable because it will allow people to
focus in on certain RFCs that effect them. This means that potentially effected
parties have to spend less time wading through all of the RFCs in the
repository to find the handful that will affect them. Overall, this change will
make reviewing RFCs a much more manageable process for new members and people
that are concerned with specific parts of the specification.

# Implementation
[Implementation]: #implementation

RFCs should be labeled with what part of the specification it affects as well
the target audience during Working Group meetings while all RFCs are being
reviewed.
