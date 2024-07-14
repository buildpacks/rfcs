# Meta
[meta]: #meta
- Name: Additional Application Image Metadata
- Start Date: 2024-03-05
- Author(s): dmikusa
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

When using a `Dockerfile`, it is possible to set additional metadata items like exposed ports and health check information. This metadata can be used by external systems, like container orchestrators, to automatically configure and deploy application images. It is not presently possible to set this metadata using buildpacks.

# Definitions
[definitions]: #definitions

Dockerfiles settings for the proposed metadata:

- Ports can be set with [`EXPOSE`](https://docs.docker.com/reference/dockerfile/#expose)
- Health check information can be set with [`HEALTHCHECK`](https://docs.docker.com/reference/dockerfile/#healthcheck)

# Motivation
[motivation]: #motivation

- It is not presently possible to set this metadata using buildpacks.
- Deploying with Docker or other container orchestrators, the system can use this information to more easily run images.
- To support Prometheus' or Grafana Agent's Docker Service Discovery. The exposed port will be used to scrape metrics. If you don't expose (or map) your port, the service discovery doesn't find the container.

# What it is
[what-it-is]: #what-it-is

This RFC proposes that we add additional extension points so that it is possible to expose port and health check information in the application container images that are generated.

As a buildpack author, I will be able to include port and health check information as part of the process type that are defined by a buildpack. 

For each process type defined, I can add a list of ports. A port is defined as the port number and an optional protocol. If the protocol is not set, then `TCP` is assumed. To expose both `TCP` and `UDP`, then the port number should be included twice. Once with with each protocol. Valid values for the protocol are `TCP` and `UDP`. This is the same behavior as Docker's `EXPOSE` functionality, which is intentional, as it should enable buildpack metadata to map in the same way as `Dockerfile` metadata.

For each process type defined, I can add health check information. The following health check properties will be available: interval, timeout, start period, start interval, retries, and command. If no health check information is provided, then nothing will be added to the image.

Because the image can only have a single set of ports and health check information, the lifecycle will include the information for the default process type when it exports the application image.

As an end user, if I want to have different ports/health check information exposed on the application image then the user will set the `--default-process` flag to `pack build` and change the default process type.

# How it Works
[how-it-works]: #how-it-works

As a buildpack author, additional information can be written into the [`launch.toml` file](https://github.com/buildpacks/spec/blob/main/buildpack.md#launchtoml-toml). This will include an array of ports and the health check information as described above.

Example:

```
[[processes]]
type = "web"
command = ["java"]
args = ["-jar", "app.jar"]
default = true
working-dir = "/workspace"

[[processes.ports]]
port = 8080
protocol = "TCP"

[[processes.ports]]
port = 8081  # protocol is optional, defaults to "TCP"

[processes.health-check]
interval = "20s"
timeout = "3s"
start-period = "1m"
start-interval = "30s"
retries = 3
use-shell = true
command = "thc"
```

This information is written into the `Config` section of the image metadata.

```
{
    ...
    "Config": {
        ...
        "ExposedPorts": {
            "8080/tcp": {},
            "9000/udp": {}
        },
        "Healthcheck": {
            "Test": [
                "CMD-SHELL",
                "thc"
            ],
            "Interval": 20000000000,
            "Timeout": 3000000000,
            "StartPeriod": 60000000000,
            "Retries": 3
        },
        ...
    }
    ...
}
```

The `Test` section is an array of the command to run. If `use-shell` is `true`, then the first item in the array is set to `CMD-SHELL`. If `use-shell` is `false` then the first item in the array is set to `CMD`. In addition, values for interval, timeout, start period, and start interval should be converted to nano seconds. This is all to be consistent with the way Docker embeds metadata from a `Dockerfile`, which is a major goal of this proposal.

# Drawbacks
[drawbacks]: #drawbacks

None beyond the time to implement.

# Alternatives
[alternatives]: #alternatives

None

# Prior Art
[prior-art]: #prior-art

None

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

None

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This RFC requires changes to `launch.toml`. They are additive changes, so backward compatible. It adds the ports array and health-check object as described in the example above.