# Meta
[meta]: #meta
- Name: Rust Launcher Implementation
- Start Date: 2026-06-10
- Author(s): @hone
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes porting the CNB `launcher` from Go to Rust. The primary driver is to eliminate security scanner noise and false positives caused by vulnerabilities in the Go standard library, which currently forces platform operators to either silence warnings or patch the `launcher` in application images. 

# Definitions
[definitions]: #definitions

- MUSL is an implementation of the C standard library built on top of the Linux system call API, including interfaces defined in the base language standard, POSIX, and widely agreed-upon extensions. This lets us build binaries that don't link against the system's glibc.

# Motivation
[motivation]: #motivation

As it stands, when CVEs are discovered within the Go standard library (such as networking or TLS-related issues), container scanners flag them against any image containing a compiled Go binary, including the CNB `launcher`. For platform operators, this creates significant operational noise. They are forced to choose between silencing security alerts or constantly updating and rebuilding the `launcher` to keep up with the "treadmill" of Go runtime patches as seen in [RFC#336](https://github.com/buildpacks/rfcs/pull/336).

Looking at the recent security advisories in recent years, the CVEs flagged against the Go standard library and compiler fall into a couple of buckets:

- HTTP/2 & Networking Layer (Largest bucket) - the largest volume of high-severity CVEs are flagged against `net/http`, `net/http/httputil`, and `crypto/tls`.
- Privilege Escalation & Unix - CVE-2023-29403 exhibited a case where `setuid` / `setgid` did not alter the behavior.

While Rust is not immune to CVEs or security patches, but there are fewer because Rust's standard library is much smaller which decreases the attack surface area. It does not include an HTTP server, TLS stack, or a JSON parser. Instead, this is pushed to the crate dependencies in a Rust stack. In addition, Rust has a minimalist runtime that doesn't include a garbage collector or a runtime scheduler. Rust maps tasks to native OS threads which removes this abstraction between the code and the OS, trading Go's runtime scheduling for a reduced attack surface area.

The biggest core Rust vulnerability in recent years was [CVE-2024-24576](https://nvd.nist.gov/vuln/detail/cve-2024-24576) where the Rust standard library's `std::process::Command` did not properly escape arguments when invoking batch files (`.bat` and `.cmd`). This allowed attackers to inject arbitrary shell commands since Windows passes arguments as a single raw string.

The core crates that will likely be used for this have 0 CVEs in recent years: `serde`, `toml`, and `libc`.

This is isn't a large lift becauses the the `launcher` is simple and has very few dependencies where it needs to process files, the environment, and handle command/shell execution. One of the bonuses from this rewrite is with the smaller Rust surface area and the code only needing to work for `launcher` use cases, the amd64 Linux MUSL binary is ~700 KB, which is a significant reduction from the current ~2.9 MB Go binary.

# What it is
[what-it-is]: #what-it-is

The goal is to provide a "drop-in" replacement for the existing Go `launcher`. To avoid creating a migration nightmare for buildpack authors or platform implementers, the Rust implementation must be functionally identical in its interface, output, and execution behavior (e.g., command-line arguments, output/error messages, exit codes, and environment handling). In addition, it needs to provide all the architectures the `launcher` supports today.

A draft implementation is available at <https://github.com/hone/launcher-rs>.

# How it Works
[how-it-works]: #how-it-works

The `launcher` will be implemented as a statically linked, lightweight Rust binary using MUSL where possible for maximum portability.

1. System Interfaces (`rustix` & `libc`): Instead of wrapping the entire application in raw C-bindings, the Rust launcher primarily leverages the `rustix` crate for safe, idiomatic POSIX APIs (like pipe creation). However, it strategically drops down to raw `libc` within `unsafe` closures when strictly necessary to satisfy the CNB specification like calling `libc::dup2` during `CommandExt::pre_exec` to map the `exec.d` communication pipe to File Descriptor 3 before spawning a child process.
1. Process Replacement: To seamlessly replace the launcher process with the user's application, the implementation uses `std::os::unix::process::CommandExt::exec()`. This maps directly to the `execve` syscall, completely clearing the launcher from the process tree and memory, analogous to Go's `syscall.Exec`.
1. Strict Exit Code Mapping: The implementation uses Rust's `Result` type and a centralized `LaunchError` enum to strictly map internal failures (e.g., parsing errors, environment failures) to the exact integer exit codes mandated by the CNB API (like `PlatformApiIncompatible` or `BuildpackApiIncompatible`).

The `launcher` will live in a separate repo from the current `lifecycle` repo and will live at <https://github.com/heroku/launcher-rs>. This provides a few benefits:

- keep language specific ecosystem tooling separate
- opens the door for component maintainers for Rust :pray:
- versioning around the `launcher` can match the stability of the API surface area which is fairly stable

# Migration
[migration]: #migration

The `launcher` is a critical runtime level component so it's important we ensure stability and verify parity. In order to achieve this there will be a phased rollout:
1. Smoke Testing - The Rust implementation will run alongside the go one in the `lifecycle` acceptance tests so any drifts can be caught ahead of time.
1. Deprecation Period - Once we deem the Rust binary is mature and can be a drop in replacement, we will deprecate the Go binary.
1. Dual Distribution - We will ship both the Go and Rust binaries within `buildpacksio/lifecycle` images simultaneously for this time period also during the testing period. A ~700 KB is a minimal size bump.
1. Rust as the Default - Once we feel comfortable, the Rust `launcher` will become the default where the Go implementation can be used as a fallback.
1. Full Replacement - Once the deprecation window has expired, the Go implementation be replaced by the Rust binary.

## Dual Distribution

During the testing period, users and platforms can opt into the Rust launcher through three distinct entrypoints:

- Runtime Opt-In (App Developers) - The existing Go launcher will act as a shim. If a specific environment variable is present at runtime (e.g., `CNB_EXPERIMENTAL_RUST_LAUNCHER=true`), the Go launcher will immediately delegate execution to the Rust binary. This allows testing on any existing application image with both binaries.
- CLI Opt-In (Pack Users) - `pack` can introduce an experimental flag. When used, the exported OCI image will have its `ENTRYPOINT` permanently set to the Rust binary, bypassing the Go shim entirely.
- Platform Opt-In (Platform Operators) - Platforms can configure their builders or lifecycle executions to write the Rust binary as the default entrypoint, making the transition completely transparent to their end users.

# Drawbacks
[drawbacks]: #drawbacks

- New Language - A transition to Rust requires contributors who are comfortable with a new language that we don't use for any other project today. This can be made easier through the use of AI/agentic tools to assist in code management and we may be able to attract some Rust contributors like the maintainers of [libcnb.rs](https://github.com/heroku/libcnb.rs).
- Double the Maintenance - Until the Go implementation is replaced, material changes will need to be handled across both implementations. The biggest thing in our favor here is that the `launcher` interface is stable, so there aren't a lot of planned changes atm.

# Alternatives
[alternatives]: #alternatives

## Do Nothing
Maintaining the Go-based `launcher` preserves the current operational burden, requiring platform operators to continuously respond to upstream Go runtime CVEs that are unrelated to the actual logic of the `launcher`.

# Prior Art
[prior-art]: #prior-art

There are many examples out there of projects rewriting from Go to Rust, they're usually used for minimizing the runtime which leads to lower overhead, faster startup, and better C/FFI interop story. The first two apply to us, but is not the main driver.

The only one that looks like this split in `lifecycle` is AWS Bottlerocket. They use Go for interfacing with CNCF tooling/k8s and Rust is used as the OS's internal footprint.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What other smoke tests do we need to do to feel comfortable with this?
- Are we ok with adding Rust as a language?
- How does a user opt into bundling the Rust launcher?
- How long should the deprecation window be?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
N/A. This should be a drop in replacement of the current Go `launcher` implementation.

# History
[history]: #history
