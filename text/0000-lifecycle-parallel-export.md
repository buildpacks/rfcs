# Meta
[meta]: #meta
- Name: Export App Image and Cache Image in Parallel
- Start Date: 2023-08-26
- Author(s): ESWZY
- Status: Draft
- RFC Pull Request:
- CNB Pull Request: [lifecycle#1167](https://github.com/buildpacks/lifecycle/pull/1167)
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

Export app image and cache image in parallel during export phase of lifecycle. In the original logic, it has to wait for the export of the app image to be completed before exporting the cache image. This will result in a period of idleness, and the network resources and I/O resources will not be fully utilized, resulting in a longer waiting time for the overall export, and also a longer overall build time. By parallelizing export phase, network and I/O resources can be used to the maximum, thereby saving time.

# Definitions
[definitions]: #definitions

* lifecycle: software that orchestrates a CNB build.
* Cache Image: The cache stored between builds - stored in a registry.

# Motivation
[motivation]: #motivation

In some scenario, the app image and the cache image need to be exported at the same time, but this process is serial in the lifecycle, which means that after the app image is exported, we have to wait for the cache image to be exported. But we don’t need to wait for the export of cache image, only after the app is exported, we can continue to next steps (distribution and deployment).

So we can try to parallelize this step ([lifecycle#1167](https://github.com/buildpacks/lifecycle/pull/1167)) and compare it with serial exporting. After testing the build on some applications, this modification can shorten the export time.

- Java (app image is 202.361MB, cache image is 157.525MB, with one same layer: 107.648MB):
    - Before: total 18.34s, app 8.96s, cache 9.38s
    - After: total 14.70s, app 11.42s, cache 13.93s
    - app image layers: 0+1.103MB+15.153MB+107.648MB+49.953MB+0+0+28.502MB
    - cache image layers: 9.411MB+40.465MB+107.648MB

- Go (app image is 114.273MB, cache is 175.833MB, no same layer):
    - Before: total 16.57s, app 5.92s, cache 10.65s
    - After: total 12.02s, app 7.31s, cache 11.48s
    - app image layers: 0+1MB+25.72MB+8.993MB+49.953MB+0+0+28.502MB
    - cache image layers: 70.87MB+104.964MB

# What it is
[what-it-is]: #what-it-is

The proposal is to add a new capability to the lifecycle (enabled by configuration) to export app image and cache image to registry in parallel.

The target personas affected by this change are:

 - **buildpack user**: they will experience higher disk I/O or network pressure if this feature is enabled by default.
 - **Platform implementors**: they will choose parallel or serial export, to suit how the platform works. Serial export helps to get app image faster, while parallel export can complete the build process faster.

This proposal, in addition to acceleration, has the greatest impact on the export time of app image. This will lead to resource competition, that is, when the app image and cache image are exported at the same time, the app image export time will become longer. For some users, they only care about the export time of the app image, but not the overall optimization effect, and enabling this capability will affect their performance. Therefore, this ability is optional.

The flag name, refer to other boolean flag like `daemon`, `layout`, I think it can be named `parallel`. And then the usage is just like this:
```
/cnb/lifecycle/exporter \
  [-analyzed <analyzed>] \
  [-app <app>] \
  [-cache-dir <cache-dir>] \
  [-cache-image <cache-image>] \
  [-daemon] \ # sets <daemon>
  [-extended <extended>] \
  [-gid <gid>] \
  [-group <group>] \
  [-launch-cache <launch-cache> ] \
  [-launcher <launcher> ] \
  [-launcher-sbom <launcher-sbom> ] \
  [-layers <layers>] \
  [-layout] \ # sets <layout>
  [-layout-dir] \ # sets <layout-dir>
  [-log-level <log-level>] \
  [-parallel] \ # sets <parallel>
  [-process-type <process-type> ] \
  [-project-metadata <project-metadata> ] \
  [-report <report> ] \
  [-run <run>] \
  [-uid <uid> ] \
  <image> [<image>...]
```

# How it Works
[how-it-works]: #how-it-works

It will be done using goroutines. Goroutine is a lightweight multi-threading mechanism, which can avoid a lot of extra overhead caused by the multi-threaded parallel operation. This function encapsulates the export process of the app image and the cache image into two goroutines to execute in parallel.

The working principle is shown in the following code (go-like pseudocode). Execute in parallel through two goroutines and wait for all export processes to finish. If parallel export is not enabled, the process is exactly the same as the original serial export.

```go
func export() {
    exporter := &lifecycle.Exporter{}
    // ...
    
    var wg sync.WaitGroup
    
    wg.Add(1)
    go func() {
        defer wg.Done()
        exporter.Export()
    }()
	
    if !enableParallelExport {
        wg.Wait()
    }
    
    wg.Add(1)
    go func() {
        defer wg.Done()
        exporter.Cache()
    }()
    
    wg.Wait()
    
    // ...
}
```

## Examples

For command line use, control this process through the `parallel` flag.

### Export both app image and cache image

By specifying environment variable `CNB_PARALLEL_EXPORT`, or pass a `-parallel` flag, images will be pushed to `cr1.example.com` and `cr2.example.com` simultaneously.

```shell
> export CNB_PARALLEL_EXPORT=true
> /cnb/lifecycle/exporter -app cr1.example.com/foo:app -cache-image cr2.example.com/foo:cache

# OR

> /cnb/lifecycle/exporter -app cr1.example.com/foo:app -cache-image cr2.example.com/foo:cache -parallel
```

### Export app image only or export cache image only

If export one image, the effect of this function is not very obvious.

```shell
> export CNB_PARALLEL_EXPORT=true
> /cnb/lifecycle/exporter -app cr1.example.com/foo:app
[debug] Parsing inputs...
[warn] parallel export has been enabled, but it has not taken effect because cache image (-cache-image) has not been specified.

# OR

> /cnb/lifecycle/exporter -app cr1.example.com/foo:app -parallel
[debug] Parsing inputs...
[warn] parallel export has been enabled, but it has not taken effect because cache image (-cache-image) has not been specified.

# EQUAL TO

> /cnb/lifecycle/exporter -app cr1.example.com/foo:app
```

# Migration
[migration]: #migration

We maybe need to add a new API option for buildpack users, to choose whether this feature should be enabled.

# Drawbacks
[drawbacks]: #drawbacks

 - This will lead to resource competition, the app image export time will become longer. 

# Alternatives
[alternatives]: #alternatives

N/A.

# Prior Art
[prior-art]: #prior-art

N/A.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- How to allow users to choose the export method? environment variable? Or a parameter of the creator? 
- Does it also need to be specified in the pack tool?
- Should this feature be enabled by default?

# Spec. Changes
[spec-changes]: #spec-changes

This new feature will affect the API of [Create](https://buildpacks.io/docs/concepts/components/lifecycle/create/) and [Export](https://buildpacks.io/docs/concepts/components/lifecycle/export/) phases, by adding the following fields.

Back to API changes, we will add a new flag to control this.

| Input        | Environment Variable  | DefaultValue | Description                                  |
|--------------|-----------------------|--------------|----------------------------------------------|
| `<parallel>` | `CNB_PARALLEL_EXPORT` | `false`      | Export app image and cache image in parallel |


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