# Meta
[meta]: #meta
- Name: Lifecycle as a multicall binary for build phases
- Start Date: 01/21/2020
- Status: Approved
- CNB Pull Request: [rfcs#45](https://github.com/buildpacks/rfcs/pull/45)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

We should compile the lifecycle as a multicall binary for the build phases of detect, analyze, restore, build, export and rebase while retaining the interface to the phases. The binary can also support the phases as subcommands with the phases in their verb form.


# Motivation
[motivation]: #motivation

- The size of the lifecycle release decreases from 24M to 7M.
- This should speed up time take to build the lifecycle as far fewer binaries get built.
- The size of the builders will decrease.


# What it is
[what-it-is]: #what-it-is

We are proposing changing the lifecycle release archive to contain the following:
- `lifecycle` binary: The build phases (detector, analyzer, restorer, builder, exporter, rebaser) of the lifecycle will exist as a multicall binary
- symlinks linking `detector`, `analyzer`, `restorer`, `builder`, `exporter` and `rebaser` to the `lifecycle` binary
- `launcher` binary: The launcher will exist as a separate binary

```
tar tfv ./out/lifecycle-v*.*.*+linux.x86-64.tgz
-rw-r--r--  0 user staff      ** Jan 32 25:98 lifecycle.toml
drwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/
-rwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/launcher
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/rebaser -> lifecycle
-rwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/lifecycle
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/exporter -> lifecycle
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/builder -> lifecycle
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/analyzer -> lifecycle
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/restorer -> lifecycle
lrwxr-xr-x  0 user staff      ** Jan 32 25:98 lifecycle/detector -> lifecycle
```


# How it Works
[how-it-works]: #how-it-works

Symlinking is used to map the zeroth arg passed to the binary to determine which phase will be executed. The flags shall be parsed accordingly and the desired phase will be invoked.
[Reference Implementation.](https://github.com/buildpacks/lifecycle/pull/232)

Additionally, the multicall binary will support the lifecycle phases as subcommands. The subcommand will have to be the verb form of the phase, ie `./lifecycle/lifecycle analyze` will invoke the `analyzer`, `./lifecycle/lifecycle export` will invoke the `exporter` command etc.


# Drawbacks
[drawbacks]: #drawbacks

- Confusion around the contents of a lifecycle release, which will now contain 2 binaries and multiple symlinks
- If additional phases are introduced to the lifecycle, symlinks will have to be updated accordingly.


# Alternatives
[alternatives]: #alternatives

Continue to have a separate binary for each phase of the build process


# Prior Art
[prior-art]: #prior-art

[Busybox](https://busybox.net/downloads/BusyBox.html)
This is an example of a multicall binary that also has subcommand support.


# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Are there other ways to achieve the same objective?
