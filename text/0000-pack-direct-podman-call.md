# Meta
[meta]: #meta
- Name: Pack direct podman call
- Start Date: 2023-06-16
- Author(s): dvaumoron
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

A flag `--daemonless` will be added to the `pack` CLI, the flag presence will switch from the current functioning to one where podman is called directly (without needing a daemon backed socket)

# Definitions
[definitions]: #definitions

N/A

# Motivation
[motivation]: #motivation

This will allow to use pack as a standalone on the OS supported by podman (currently Linux, as Windows and macOS need podman machine), making possible to use pack without installing docker or podman (a tool like skopeo will still be necessary to send image in registries)

# What it is
[what-it-is]: #what-it-is

Adding `--daemonless` to the `pack` command which currently need docker call would allow them to work without docker installed.

# How it Works
[how-it-works]: #how-it-works

The flag will change the initialization of the CommonAPIClient passed to call docker (interface defined in "github.com/docker/docker/client") by an adapter conforming to the used subset [DockerClient](https://github.com/buildpacks/pack/blob/main/pkg/client/docker.go#L14) to call podman as a library (forwarding calls to an initialized instance of [ContainerEngine](https://github.com/containers/podman/blob/main/pkg/domain/entities/engine_container.go#L16)).

The adapter will look like :
`type podmanAdapter struct {
    inner entities.ContainerEngine
}

func MakePodmanAdapter() DockerClient {
    // initialization of engine
    return podmanAdapter{inner: engine}
}

func (a podmanAdapter) ContainerCreate(ctx context.Context, config *containertypes.Config, hostConfig *containertypes.HostConfig, networkingConfig *networktypes.NetworkingConfig, platform *specs.Platform, containerName string) (containertypes.CreateResponse, error) {
    // initialization of specGenerator from the different configs
    report, err := a.inner.ContainerCreate(ctx, specGenerator)
    if err != nil {
        return containertypes.CreateResponse{}, err
    }
    // initialization of adaptedReport from the report
    return adaptedReport, nil
}`

# Migration
[migration]: #migration

The current mode of `pack` operation is the default mode of operation.  The proposed `--daemonless` mode of operation is an optional mode of execution.  We will need to document how to switch between operation modes and the motivations for choosing an appropriate mode of operation.

# Drawbacks
[drawbacks]: #drawbacks

pack contributor could need to update the podman dependencies in go.mod for bugfixes

# Alternatives
[alternatives]: #alternatives

pack user could have dificulties to set up docker or podman to work with the pack CLI

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

N/A

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