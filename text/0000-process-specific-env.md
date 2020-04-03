# Meta
[meta]: #meta
- Name: Process Specific Environment
- Start Date: 2020-04-03
- CNB Pull Request: 
- CNB Issue: 
- Supersedes: N/A

# Summary
[summary]: #summary

Each process type could have its own independent environment variables.

# Motivation
[motivation]: #motivation

- Greater flexibility to define runtime processes
- When a new process type is created it often has different requirements for environment variables
- I want to run a process of type "foo" and get different entris in `env` than process of type "web"

# What it is
[what-it-is]: #what-it-is

Each env or profile layer dir can have subdirs like `<layer>/env.launch/web/` and `<layer>/profile.d/web/`. These behave the same way as `<layer>/env` but are specific to the launch of the "web" process.

# How it Works
[how-it-works]: #how-it-works

# Drawbacks
[drawbacks]: #drawbacks

# Alternatives
[alternatives]: #alternatives

# Prior Art
[prior-art]: #prior-art

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
