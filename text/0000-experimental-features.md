# Meta
[meta]: #meta
- Name: Space and Process for Experimental Features
- Start Date: 2020-07-02
- Author(s): [@jkutner](https://github.com/jkutner)
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal for allowing experimental features without requiring a specification, core team review, or RFC.

# Motivation
[motivation]: #motivation

End-users and early adopters of CNB have real problems that need to be solved by the CNB project. Sometimes these problems prevent them from adopting CNB in their organizations. Our RFC process, specification guidelines, and governance structure provide a strong mechanism through which we can enact change and solve problems; but sometimes it's too heavy and inhibits experimentation.

We need a way to introduce experiments before writing an RFC. Such a mechanism would allow us to deliver new capabilities faster, improve our means of collecting real end-user feedback, and improve the quality of our RFCs.

# What it is
[what-it-is]: #what-it-is

- *experimental feature* - any behavior or options that are likely to change before being added to the specification

This proposal affects buildpack users, platform implementors, and project contributors who want to introduce experimental features. Today, any significant change that impacts end-users is introduced through an RFC, which requires a successful vote by the core team before being introduced into the specification (or the Pack platform).

We seek to change the current process such that experimental features do not require an RFC or specification. Instead, an experimental feature would only require approval by a simple majority of the relevant sub-teams maintainers.

# How it Works
[how-it-works]: #how-it-works

In order to suggest an experimental feature, a tracking GitHub issue is created with the "experimental" label in the relevant repo. The issue should describe what it is, what it's trying to prove, and a proposed end date of the experiment. The end dates can be extended if needed.

The sub-team that maintains the project can decide with a majority vote whether or not to introduce the feature as long as it is behind a mechanism that enables or disables these features. Where possible when a feature is used it should log a warning after it's used with a message that you used this experimental feature and a link to the tracking issue to collect feedback.

When the experiment has ended, there are two possible outcomes:
- if deemed not successful, the feature should be removed
- if deemed successful a RFC/implementation should be done depending on the feature

If not much feedback is collected, that will be taken into account but ultimately up to the subteam in how to proceed.

# Drawbacks
[drawbacks]: #drawbacks

- End users may become tied to features that eventually go away or significantly change

# Alternatives
[alternatives]: #alternatives

## Plugins

A plugin system for Pack and/or Lifecycle would allow experimental features to be implemented completely outside of the CNB project. For example, a plugin could be installed to Pack with a command like:

```
$ pack install-plugin skele-gro
```

Then, a user can execute new commands provided by the plugin:

```
$ pack grow-bones
```

Or use new flags on existing commands:

```
$ pack build --with-bone-growth
```

Such a plugin mechanism would require a well defined plugin-interface, and versioning of that interface. This is a significantly larger project that the current proposal. However, the current proposal does not prevent a plugin system from being introduced later on.

# Prior Art
[prior-art]: #prior-art

- Rust's [Unstable features](https://doc.rust-lang.org/rustdoc/unstable-features.html)
- Java's [`-XX:+UnlockExperimentalVMOptions` flag](https://bugs.openjdk.java.net/browse/JDK-6618726)
- [oclif Plugins](https://oclif.io/docs/plugins)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How does an experimental features become a real feature (does it use the same flag/command minus the `--experimental` flag)?
