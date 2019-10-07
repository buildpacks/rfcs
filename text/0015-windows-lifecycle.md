# Meta
[meta]: #meta
- Name: Support for Windows in the Lifecycle components
- Start Date: 2019-10-07
- CNB Pull Request: [rfcs#27](https://github.com/buildpack/rfcs/pull/27)
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

Implement all lifecycle phases for the Microsoft Windows Operating System and any OCI-compliant Windows container backend. Use Windows conventions as alternatives to Linux-specific conventions where necessary to achieve feature parity with current functionality.

# Motivation
[motivation]: #motivation

Windows app developers already use containerization as a very important tool for easing deployment for headless Windows applications with tools like Docker for Windows, Cloud Foundry and Kubernetes with Windows Workers. However, the same Day 1 and 2 challenges that CNBs help solve - deployment conistency, dependency management, rebasing, etc - are equally prominent for these containerized Windows apps. Nearly every use-case and persona for Linux containers also exists for Windows, though there is generally less modern tooling available to ease app migration.

A common use-case for CNBs with Windows apps would be migrating an existing deployment of a Windows .NET application. A traditional deployment consists of .NET framework apps authored in Visual Studio on a Windows desktop, deployed directly to Microsoft Internet Information Services on a Windows Server Virtual Machine with various Operating System-level, library-level and app-level interdependencies. Traditional app developers and operators often have to coordinate and manually perform app and dependency changes in these deployments. By migrating to Cloud Native Stacks, Buildpacks and app layers, these bespoke Windows deployments could be decomposed into OCI-image layers increasing automation, consistency and maintainability.

Furthermore, traditional Windows deployments often use compiled artifacts like Dynamic Link Libraries (DLL) and Executables (EXE) which in turn are often deployed via self-executable installers (MSI or sometimes EXE). In many cases, a Platform Operator (sometimes even the Buildpacks User) has no source code access for either the app, dependencies or Operating System. These components must rely on runtime ABI compatiblity guarantees from the OS and pre-installed software on a Virtual Machine - usually a bespoke "golden image" created manually by a Platform Operator. CNBs would allow a more useful abstraction for these interdependencies beyond Virtual Machine conventions and even Dockerfiles but still provide something close to a "golden image"-level guarantee of artifact compatibility.

A Buildpacks User would expect to follow roughly the same steps and patterns for migrating apps for both Windows or Linux to Stacks and CNBs, though using Windows-specific artifacts, buildpacks and tooling where no cross-plaform standard exists. In the end, they would expect to generate Windows-specific OCI-images which they could host on any registry and which they would run on a Windows-based, OCI-compliant container server such as Docker for Windows, Windows Server containers or Kubernetes with Windows Workers.

# What it is
[what-it-is]: #what-it-is

This RFC proposes adding official Windows support to the lifecycle which can be optionally used by all platforms and buildpacks. There will be a new Windows-specific, distributable lifecycle artifact containing cross-compiled versions of lifecycle commands. Buildpacks can be either Windows-specific or cross-platform by following Windows conventions. Windows-specific builder images can be created based on the lifecycle and buildpacks.

This introduces new functionality that is relevant to all personas that interact with buildpacks. This has no impact on existing users.

# How it Works
[how-it-works]: #how-it-works

Several steps will need to happen to enable Linux and Windows feature parity:
1. Project Contributors change the buildpack and platform specs to maintain all existing Linux functionality, but Windows implementations MUST ensure:
    - All platform and container file paths MUST be Windows format (ex: `/bin` => `c:\bin`).
    - All lifecycle binary file names MUST be Windows executables with `.exe` or Windows Batch Script files with `.bat` suffixes.
    - All buildpack binary file names MUST be Windows executables with `.exe` or Windows Batch Script files with `.bat` suffixes.
    - All Linux OCI-image TAR layer file paths (ex: `/cnb`) MUST be Windows OCI-image TAR layer files paths (ex: `Files/cnb`).
    - All references to a default shell MUST be `cmd.exe` (Windows Command Prompt).
    - All references to profile scripts MUST be Windows Batch-formatted files with a `.bat` suffix.
    - All references to I/O devices MUST be valid Windows I/O devices (ex: Linux `/dev/stderr` => Windows `>&2`).
    - All cross-platform environment variables MUST be implemented on Windows (ex: `PATH`)
    - All Linux-specific environment variables MAY NOT be implemented on Windows (`LD_LIBRARY_PATH` and `LIBRARY_PATH`)
2. Project Contributors implement changes to the lifeycle.
3. Project Contributors cross-compile and distribute lifecycle commands as separate Linux and Windows lifecycles.
4. Optionally, Platform Implementors change existing platform implementations to support both Linux and Windows lifeycles and backend container runtime APIs.
5. Optionally, Buildpack Authors write new Windows-specific or cross-platform buildpacks.

# Drawbacks
[drawbacks]: #drawbacks

Timing might be important - breaking API changes should be prioritized before cross-cutting, secondary implementations are added.

Windows container runtimes (Docker for Windows with Windows Containers, Containerd) have mostly stabilized but still see more active development and API changes than Linux, making Platforms implementing Windows potentially require more changes over time.

Windows base images are closed-source, proprietary, require Windows licenses for use, have limitations on redistribution and are hosted on Microsoft's registry. This increases the inertia for all personas to use these features.

# Alternatives
[alternatives]: #alternatives

There are currently no alternative Windows lifecycle implementations.

# Prior Art
[prior-art]: #prior-art

Some existing tools with overlapping use-cases:
- Microsoft .NET Framework Runtime images:
    - [ASPNET .NET Framework Docker images](https://hub.docker.com/_/microsoft-dotnet-framework)
- Microsoft OS base images:
    - [Windows Server Core Docker base images](https://hub.docker.com/_/microsoft-windows-servercore)
    - [Windows Nanoserver Docker base images](https://hub.docker.com/_/microsoft-windows-nanoserver)
- Windows Container runtimes:
    - [Docker - Containers on Windows](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers)
    - [Kubernetes with Windows Workers](https://kubernetes.io/docs/setup/production-environment/windows/user-guide-windows-containers/)
    - [Containerd](https://docs.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/containerd)
    - [winc: OCI runtime CLI](https://github.com/cloudfoundry/winc)
    - [hcsshim: Windows Server Container API wrapper](https://github.com/microsoft/hcsshim)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

Windows applications and Operating Systems have additional concerns beyond Linux feature parity that are non-blocking but should be addressed:
- How should Buildpack Authors and Platform Implementors support [Windows Registry](https://en.wikipedia.org/wiki/Windows_Registry) hive modification?
- How do Windows [base-image redistribution requirements](https://docs.microsoft.com/en-us/virtualization/windowscontainers/about/faq#how-do-i-make-my-container-images-available-on-air-gapped-machines) affect Buildpack User and Platform Operator workflows?
- Should we support Powershell as a shell and/or profile format in addition to Command Prompt and Batch Script files?
