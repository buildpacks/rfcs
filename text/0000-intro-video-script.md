# Meta
[meta]: #meta
- Name: Intro video script
- Start Date: 2021-05-18
- Author(s): yaelharel
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Improving documentation is a project priority for 2021.
This RFC is an attempt to create an easy and clear starting point for new users and contributors.

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

It is currently relatively challenging for new users and contributors to understand what buildpacks are and what is the purpose of our project.
It can be very useful to have a ~1 minute introductory video to provide high-level answers to these questions.
We can post this video on our website and share it on social media.
Hopefully this will help familiarize more people with our project.


# What it is
[what-it-is]: #what-it-is

### The script

As an application developer, you should focus on what you do best - writing code, without having to worry about image security, optimizing container images, or your container build strategy. How much time have you spent struggling to wrangle yet another Dockerfile? Copying and pasting random Dockerfile snippets into every project? Buildpacks can help you with just that! They are a better approach to building container images for applications.

Buildpacks are programs that transform source code into container images by analyzing the code and determining the best way to build it. They can provide dependencies, configuration, run compilation, and much more! A buildpack can be written by anyone, and shared with everyone! Google, Heroku, and the Paketo project provide buildpacks for a wide variety of language families, and you can discover even more by searching the buildpack registry. With buildpacks, you can use best-in-class container build strategies from industry experts with ease.

Even more so, the Cloud Native Buildpacks project provides a specification for buildpack authors and platforms that ensures builds are fast, secure, customizable, and can run on any cloud. It is a Cloud Native Computing Foundation project with many existing integrations. Platforms such as Google Cloud Run, Hashicorp Waypoint, Heroku, Spaceship, and VMWare Tanzu, just to name a few, all support using buildpacks to make container images.

You are invited to join our community. Try Buildpacks with your favorite language today.


# How it Works
[how-it-works]: #how-it-works

After this RFC will get accepted and merged, we will start working on the actual video. 

# Drawbacks
[drawbacks]: #drawbacks

* It is difficult to maintain a video, compared to maintaining documents (although we do not expect that this video will need to change any time soon because it is very basic).

# Alternatives
[alternatives]: #alternatives

N/A

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* How many words can a typical 1-minute video script include? Is the current script too long/short?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A
