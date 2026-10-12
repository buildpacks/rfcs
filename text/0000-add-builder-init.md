# Meta
[meta]: #meta
- Name: Add init configuration to builder.toml
- Start Date: 2025-05-06
- Author(s): @AidanDelaney, @ConallCav, @MikeLaptev
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes the addition of an `[init]` configuration section to builder.toml files used in the Cloud Native Buildpacks ecosystem. This section will allow builders to specify the use of an init binary (such as `tini`) to properly forward signals and reap orphaned child processes, improving runtime behavior of containerized applications.

# Definitions
[definitions]: #definitions

- **PID 1**: The first process started by the Linux kernel during system boot and is responsible for initializing the user space and reaping orphaned zombie processes. PID 1 ignores default signal behaviors that terminate other processes: `SIGINT`, `SIGTERM`, `SIGHUP`, and `SIGQUIT` do not terminate PID 1 by default. It must handle SIGCHLD correctly to reap zombie processes.

- **subreaper**: In Linux, a process that has enabled the `PR_SET_CHILD_SUBREAPER` flag. This special process will "adopt" and reap any orphaned child processes whose parent dies, instead of having those processes re-parented to the init process (PID 1). This helps prevent zombie processes and ensures proper signal handling.

- **Zombie Process**: A process that has completed execution but still has an entry in the process table because its exit status hasn't been collected by its parent process.

- **Process Reaping**: The act of collecting exit statuses from terminated child processes, removing their entries from the process table.

- **Init Process**: Traditionally, the first process (PID 1) started during Linux boot. In containers, this is the main application process. Unlike a traditional init system, container entrypoints often lack proper signal handling and zombie process management.

- **Tini**: A lightweight but complete init system often used in containers to properly handle process signals and reap zombie processes.

# Motivation
[motivation]: #motivation

Containers typically lack a traditional init system. This can cause issues with zombie processes and unforwarded signals, especially when the entrypoint process does not manage its child processes correctly.

To mitigate this, container runtimes like Docker offer an `--init` flag that inserts a subreaper (commonly `tini`) as PID 1. However, this must be manually enabled, and not all deployment environments support it (eg: kubernetes).

Adding subreaper support to Buildpacks via configuration will allow builders to standardize process management and improve container behavior in diverse runtime environments.

The following motivating example is a python application that loops forever. When run as PID 1 it will ignore SIGTERM, which makes it difficult for runtime platforms (podman, docker, kubernetes) to shut down the container.  Adding an `init` as PID 1 correctly handles SIGTERM.

```
import time

print("Starting an infinite loop. Ignores SIGTERM.")

while True:
    time.sleep(1)
    print("Still running...")
```

Given the above application we can:

1. Create an image using `pack build eg1`
2. Run using podman/docker `docker run –rm -it eg1`
3. Notice that a `podman stop` or `docker stop -t 10` does not immediately stop the running image and resorts to a `SIGKILL`

The following example creates a single zombie child process. The container will exit after `60` seconds. However, until the container exits the zombie process occupies an entry in the process table. In extreme cases this can exhaust all entries in the process table.

```
import os
import time

pid = os.fork()

if pid == 0:
    # Child process
    print(f"Child PID {os.getpid()}...")
    os._exit(0)
else:
    # Parent process: sleep without calling wait()
    print(f"Parent PID {os.getpid()}, child PID {pid}")
    print("Not waiting for child to finish (zombie will be created)")
    time.sleep(60)
```

Given the above example we can:

1. Create an image using `pack build eg2`
2. Run `eg2` using `podman` or `docker`
3. Observe that `docker exec {container_id} ps` shows that the child process is a zombie

The two motivating problems of signal handling and sub-process reaping can be addressed either by pushing the respoinsiblity for signal handling and sub-process reaping back onto developers, or by providing platform operators with an option to include an init-style system. This RFC allows platoform-operators to take control of the problem and proposes a mechanism allowing them to opt-in to an init-syle system on their platform.

# What it is
[what-it-is]: #what-it-is

We propose to allow platform operators define a subreaper for all images built using their builder. The use of a subreaper is optional. The omission of a subreaper from the `builder.toml` defaults to the current behaviour.

We propose that the subreaper, for example `tini`, is launched as PID 1 and runs the process defined in the image.

# How it Works
[how-it-works]: #how-it-works

Assuming an `init` binary, `tini` in this example, is available on the run time, we can simulate how processes can be forked from the `init` binary:

`docker run --rm -it --entrypoint /bin/tini py -s -- /cnb/process/web`

We propose that the enablement of a subreaper is configured at the builder level. This allows platform operators to control whether or not they want to use a subreaper on their platform.

```
[init]
enabled = true
binary = /bin/tini
```

Builders for which `init` is enabled will result in the following `launch.toml` being produced. Where `init` is provided in `launch.toml` the entrypoint for the exported image will use the given init binary as PID1.

```
[[processes]]
type = "web"
init = /bin/tini
```

The `init` field of a process interacts with the existing `direct` field. Where `direct = true` the init binary is used to launch the direct process.

```
[[processes]]
type = "web"
direct = true
init = /bin/tini
```

Where `direct = false`, or is unspecified, and an init binary is configured, then the init binary is used to launch the shell process that eventually forks the application process.

```
[[proceses]]
type = "web"
direct = false
init = /bin/tini
```

# Migration
[migration]: #migration

This feature does not replace an existing feature, migration is opt-in only.

# Drawbacks
[drawbacks]: #drawbacks
Slight increase in complexity and image size of the run image (due to inclusion of an init binary).

Introduces a build-time/runtime coupling that may not be desirable. The base run image now must include the init binary specified in `builder.toml`.

Only configurable by platform operators.

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

We considered hosting the init binary on the build image and copying it to the run image. We have opted for the more simple option of referring to the init binary on the run image.

We also considered providing a `cnb-init` binary distributed with `lifecycle`. We have opted for platform providers to supply their own preferred init binary.

Augment `launcher` with `go-reaper`.  It solves the issue of reaping child-processes, but not the issue of correct signal handling.

- What is the impact of not doing this?

The impact of not supporting an init-style system requires all application developers to support correct signal handling and implement a sub-reaper if they fork processes. In large-scale deployments, the lack of correct reapoing can lead to PID exhaustion on cluster nodes.

# Prior Art
[prior-art]: #prior-art

* Docker’s [--init](https://docs.docker.com/reference/cli/docker/container/run/#init) flag
* Kubernetes [sidecars using init processes](https://kubernetes.io/docs/tasks/configure-pod-container/share-process-namespace/#understanding-process-namespace-sharing) for signal forwarding

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Do we also allow a `pack --init` flag to allow application authors to enable `init`?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

* Impacts `builder.toml` and `launch.toml`

# History
[history]: #history

<!--
## Amended
### Meta
[meta-1]: #meta-1
- Name: (fill in the amendment name: Variable Rename)
- Start Date: (fill in today's date: YYYY-MM-DD)
- Author(s): (Github usernames)
- Amendment Pull Request: (leave blank)

### Summary

A brief description of the changes.

### Motivation

Why was this amendment necessary?
--->