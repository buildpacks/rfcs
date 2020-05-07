# Meta
[meta]: #meta
- Name: Export Report
- Start Date: (fill in today's date: 2020-04-01)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: "N/A"

# Summary
[summary]: #summary

The lifecycle export stage should optionally write a machine parsable metadata "report" about the resulting exported image(s).

# Motivation
[motivation]: #motivation

The logging output of the lifecycle export stage displays the built image's digest or image id. However, this information is not easily available for a platform that needs to utilize the resulting image from a build. 

Without this information, a platform will need to resort to suboptimal mechanisms such as parsing the exported output or reading the most recently tagged image on the registry. 


# What it is
[what-it-is]: #what-it-is

The lifecycle exporter/creator binary will accept an optional flag `report` which will provides a path to `report.toml`. When the flag is supplied the export stage will write a toml representation of the built image for platform consumption. When the flag is not provided it will default to writing report.toml in the working directory which by convention is `/layers`.

Here is an overview of the suggested schema for report.toml:

On a build published to a registry:
```
[image]
tags = ["index.docker.io/image/name:latest", "index.docker.io/image/name:other-tag"]
digest = "sha256:c8be1b8f4d60d99c281fc2db75e0f56df42a83ad2f0b091621ce19357e19d853"
```

On a build exported to the docker daemon:
```
[image]
tags = ["index.docker.io/image/name:latest", "index.docker.io/image/name:other-tag"]
image_id = "9c0e1895b90f"
```

By representing this in toml, we can extend this information with additional metadata when needed. A general philosophy for report.toml is that it should contain information that is not accessible elsewhere. For example, the bill of materials should not be included as it is available as an image label and would be unnecessarily duplicated in report.toml. 

# How it Works
[how-it-works]: #how-it-works

The export stage will write report.toml after exporting and caching is complete. If the export steps fails to complete no report.toml is expected to be written.

This addition will require a bump in the platform api.

Docker daemon based platforms such as `pack` can read the report.toml by utilizing [docker cp](https://docs.docker.com/engine/reference/commandline/cp/).

Kubernetes based platforms can utilize the [pod termination message](https://kubernetes.io/docs/tasks/debug-application-cluster/determine-reason-pod-failure/#customizing-the-termination-message) to retrieve the reports on build completion.

# Drawbacks
[drawbacks]: #drawbacks

This will require an additional flag which might complicate the lifecycle interface.

# Alternatives
[alternatives]: #alternatives

- Not doing anything and continuing to require platforms to retrieve this information via alternative means.
- Writing only the built image identifier to an unstructured file. This would be simpiler for some platforms to parse but, would limit the options for extensibility.

# Prior Art
[prior-art]: #prior-art

- [The kbld tool parses the pack output with a regex to find the built image digest](https://github.com/k14s/kbld/blob/5597786d8369e966f2e7217b24fd058f4a910675/pkg/kbld/image/pack.go#L17). 
- Tekton allows tasks to surface a built image digest with an [OCI image layout index.json](https://github.com/tektoncd/pipeline/blob/master/docs/resources.md#surfacing-the-image-digest-built-in-a-task).

# Out of Scope
[out-of-scope]: #out-of-scope

Some decisions regarding `report.toml` are explicitly out of scope for this RFC:  

- How/if `pack` should expose this information to users in a programmatic way?
- Should report.toml include additional metadata regarding layer usage?

# Spec. Changes
[spec-changes]: #spec-changes

It is likely that this would be included in the spec if and when the export stage is specified.
