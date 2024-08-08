# Meta
[meta]: #meta
- Name: Enable CNB_SKIP_SBOM IN /cnb/lifecycle/creator
- Start Date: (fill in today's date: 2023-10-17)
- Author(s): kritkasahni-google
- Status: Approved
- RFC Pull Request: 
- CNB Pull Request: 
- CNB Issue: 
- Supersedes: N/A

# Summary
[summary]: #summary

Enable CNB_SKIP_SBOM IN /cnb/lifecycle/creator to skip restoring SBOM layer from previous app image. We support CNB_SKIP_LAYERS in analyzer which does the same thing and we should support the same in creator also.

# Definitions
[definitions]: #definitions
* lifecycle: software that orchestrates a CNB build.
* creator: executes all the lifecycle phases one by one in order.
* analyzer: lifecycle phase that restores SBOM layer from previous app image.
* restorer: lifecycle phase that restores layers from cache.
* SBOM: a software bill of materials (SBOM) is a list of all the components that make up the app image.

# Motivation
[motivation]: #motivation

To skip restoring SBOM layer from previous image when platform executes lifecycle by calling /cnb/lifecycle/creator. Restoring SBOM layer from previous app image can cause degraded build latency but if buildpack logic does not rely on SBOM from previous app image then should be able to skip restoring it.

# What it is
[what-it-is]: #what-it-is

CNB_SKIP_LAYERS is used by /cnb/lifecycle/analyzer to skip restoring SBOM layer from previous app image. 
Need a similar mechanism for /cnb/lifecyle/creator specifically to skip restoring only the SBOM layer.

The target personas affected by this change are:

 - **buildpack user**: if buildpacks don't rely on reusing SBOM layer then buildpack user should ideally see improved build latency by skipping SBOM restoration but reusing other layers from previous app image.
 - **Platform implementors**: they will choose to skip restoring SBOM by providing CNB_SKIP_SBOM to trigger /cnb/lifecycle/creator.


# How it Works
[how-it-works]: #how-it-works

Similar to how CNB_SKIP_LAYERS is handled in analyzer whether SBOM needs to be [restored](https://github.com/buildpacks/lifecycle/blob/292aa492a72f4e180bb92d109a73ebf7c8a0451d/phase/analyzer.go#L38) or [not](https://github.com/buildpacks/lifecycle/blob/292aa492a72f4e180bb92d109a73ebf7c8a0451d/phase/analyzer.go#L30) today, CNB_SKIP_SBOM will be be handled in same way in analyzer.
At the platform level, it would be input same way as CNB_SKIP_LAYERS [here](https://github.com/buildpacks/lifecycle/blob/292aa492a72f4e180bb92d109a73ebf7c8a0451d/platform/defaults.go#L184) and [handled](https://github.com/buildpacks/lifecycle/blob/main/platform/lifecycle_inputs.go#L82) like:-


```
  var skipSBOM bool
	if boolEnv(EnvSkipSBOM){
		skipSBOM = true
	}
```

In the analyzer,

```
analyzer := &Analyzer{
		Logger:       logger,
		SBOMRestorer: &layer.NopSBOMRestorer{},
		PlatformAPI:  f.platformAPI,
	}

	...
	if f.platformAPI.AtLeast("0.8") && !inputs.SkipLayers && !inputs.SkipSBOM {
		analyzer.SBOMRestorer = &layer.DefaultSBOMRestorer{
			LayersDir: inputs.LayersDir,
			Logger:    logger,
		}
	}
```

# Migration
[migration]: #migration

CNB_SKIP_SBOM/<skip-sbom> will be an optional input to /cnb/lifecycle/creator, and will be false by default. We maybe need to add a new API option for buildpack users, to choose whether this should be enabled.

# Drawbacks
[drawbacks]: #drawbacks

N/A

# Alternatives
[alternatives]: #alternatives

Platforms that execute lifecycle today via /cnb/lifecycle/creator are unable to skip restoring SBOM layer from previous app image unless they skip reusing previous app image entirely.

# Prior Art
[prior-art]: #prior-art

We already support enabling CNB_SKIP_LAYERS in /cnb/lifecycle/analyzer and /cnb/lifecycle/restorer, and CNB_SKIP_RESTORE in /cnb/lifecycle/creator.
* CNB_SKIP_LAYERS in /cnb/lifecycle/analyzer to skip restoring SBOM from previous app image.
* CNB_SKIP_LAYERS in /cnb/lifecycle/restorer to skip reusing previous app image layers entirely.
* CNB_SKIP_RESTORE in /cnb/lifecycle/creator to skips restoring SBOM plus all other layers entirely from previous app image.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
This new feature will affect the API of [Create](https://buildpacks.io/docs/concepts/components/lifecycle/create/) phase by adding the following fields.

Back to API changes, we will add a new flag to control this.

| Input          | Environment Variable  | DefaultValue | Description                                  |
|----------------|-----------------------|--------------|----------------------------------------------|
| `<skip-sbom>`  | `CNB_SKIP_SBOM`       | `false`      | Skip SBOM restoration                        |

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
