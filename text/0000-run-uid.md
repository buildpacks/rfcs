# Meta
[meta]: #meta
- Name: Recommending different run-time and build-time users
- Start Date: 2021-03-15
- Author(s): [@samj1912](https://github.com/samj1912)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This proposal proposes a change to the spec to recommend a different run-time user than the build-time user in order to improve the security of the output images that are generated as a part of the build process.

# Definitions
[definitions]: #definitions

Build image: An OCI image that provides the base of the build environment.

Run image: An OCI image that provides the base from which app images are built.

Build-time user: The user which is referenced in the `User` field of the build image.

Run-time user: The user which is referenced in the `User` field of the run image.

Build-time group: The primary †GID/‡SID (GroupSid) of the `User` of build image.

Run-time group: The primary †GID/‡SID (GroupSid) of the `User` of run image.

# Motivation
[motivation]: #motivation

- Why should we do this?

Currently the [Platform Spec](https://github.com/buildpacks/spec/blob/main/platform.md#run-image) says that the run-time image's `User` along with its `CNB_USER_ID` environment variable must be set to the same user and UID†/SID‡ (OwnerSid) as the build image.

This prevents use cases where you may want the run-time user to not have the permissions to modify the built image during run-time and in general restrict the set of permissions on it. The run-time user having the same set of permissions as the build-time user could have wide-ranging security implications.

The above restriction seems to impose limitations on such use cases which are valid and are supposed to be in line with the Cloud Native Buildpack policy of secure container environments (for eg. we prevent building/running as root user).

This limitation currently seems to be enforced only by the spec and from my testing, it looks like platforms like [pack](https://github.com/buildpacks/pack) and [kpack](https://github.com/pivotal/kpack) don't actually enforce this and stacks with different run-time and build-time users seem to work as expected.

- What is the expected outcome?

Modification of the spec to recommend a different run-time user than the build-time user. For applications wishing to have write access during run-time can set the file system permissions accordingly during build-time. Stacks may also choose to have different build-time and run-time groups to enforce even stricter permissions.

# What it is
[what-it-is]: #what-it-is

A change to the spec to revert the restriction on the run-time user being the same as the build-time user.

# How it Works
[how-it-works]: #how-it-works

Since pack and in turn the lifecycle already supports this, I don't imagine we would have to change any code.


# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
Does this RFC entail any proposed changes to the core specifications or extensions? 

Yes, see above.


# Notes

When a word or bullet point is prefixed with a †, it SHALL be assumed to apply only to Linux stacks.

When a word or bullet point is prefixed with a ‡, it SHALL be assumed to apply only to Windows stacks.