# Meta
[meta]: #meta
- Name: Structured Logging
- Start Date: 2020-01-24
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Replace current lifecycle logging conventions with structured JSON logging.

# Motivation
[motivation]: #motivation

### Goal 1: Enable Platforms to parse logs if they wish

Sometimes platforms want to parse specific values from the lifecycle output (e.g the exported image digest, or the buildpack ID of a buildpack that failed during build). With the current human readable logging, this is difficult and brittle. Machine readable logging would enable platforms to consume information about the build from the logs.

In the beginning we should reserve the right to make breaking changes to log format between lifecycle releases w/o notice but we can move to stabilize over time.

### Goal 2: Enable Platforms to make their own design choices

Many platforms run the buildpack lifecycle, as they mature they may want to make their own design choices regarding user facing output. Platforms that embed lifecycle output within their own UI, may want to change colors and conventions to stylistically match the wrapping tool. Platforms may choose to emphasize different information to create the best experiences for their differing users. 

### Goal 4: Searchable logs

If the lifecycle is running a platform that aggregates logs, structured logs allow for powerful filtering and querying.

# How it Works
[how-it-works]: #how-it-works

## Output Format

Example format is best describe in a series of examples

### `detector`

#### Before
```
[detector] ======== Results ========
[detector] pass: org.cloudfoundry.openjdk@v1.0.86
[detector] skip: org.cloudfoundry.buildsystem@v1.0.205
[detector] pass: org.cloudfoundry.jvmapplication@v1.0.122
[detector] pass: org.cloudfoundry.springboot@v1.0.170
[detector] skip: org.cloudfoundry.procfile@v1.0.65
[detector] pass: org.cloudfoundry.springautoreconfiguration@v1.0.172
[detector] Resolving plan... (try #1)
[detector] fail: org.cloudfoundry.openjdk@v1.0.86 provides unused openjdk-jdk
[detector] Resolving plan... (try #2)
[detector] fail: org.cloudfoundry.jvmapplication@v1.0.122 requires openjdk-jre
[detector] Resolving plan... (try #3)
[detector] 4 of 6 buildpacks participating
[detector] org.cloudfoundry.openjdk                   v1.0.86
[detector] org.cloudfoundry.jvmapplication            v1.0.122
[detector] org.cloudfoundry.springboot                v1.0.170
[detector] org.cloudfoundry.springautoreconfiguration v1.0.172
```

#### After

##Actions
detecter
-- buildpack detect
-- resolve plan
analyzer
-- restore metadata
-- don't restore metadata
builder
-- buildpack build
exporter
-- export layer
-- cache layer
-- export slices
-- save image


```json
{"level": "verbose", "phase": "detect", "detail": {"group": 1, "buildpack": {"id": "org.cloudfoundry.openjdk", "version": "v1.0.86", "result":  "pass"}}}
{"level": "verbose", "phase": "detect", "detail": {"group": 1, "buildpack": {"id": "org.cloudfoundry.buildsystem", "version": "v1.0.205" "result":  "skip"}}}
{"level": "verbose", "phase": "detect", "detail": {"group": 1, "buildpack": {"id": "org.cloudfoundry.springboot", "version": "v1.0.170", "result":  "pass"}}}
{"level": "verbose", "phase": "detect", "detail": {"group": 1, "buildpack": {"id": "org.cloudfoundry.procfile", "version": "@v1.0.65", "result":  "skip"}}}
{"level": "verbose", "phase": "detect", "group": 1, "buildpack": {"id": "org.cloudfoundry.procfile", "version": "@v1.0.65", "result":  "skip"}}
{"level": "verbose", "phase": "detect", "detail": {"group": 1, "plan": {"attempt": 1, "result": "fail", "message":  "org.cloudfoundry.openjdk@v1.0.86 provides unused openjdk-jdk"}}}
{"level": "verbose", "phase": "detect", "group": 1, "plan": {"attempt": 2, "result": "fail", "failDetail":  "org.cloudfoundry.jvmapplication@v1.0.122 requires openjdk-jre"}}
{"level": "info", "phase": "detect", "group": 1, "plan": {"attempt": 3, "result": "pass", "passDetail":  "org.cloudfoundry.jvmapplication@v1.0.122 requires openjdk-jre"}}
```

### `analyzer`

#### Before
```
```

#### After

### logtool

This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.

# Drawbacks
[drawbacks]: #drawbacks

Drawback 1:  If many platforms start parsing the structured logs consumers will want the format to be considered part of the API and changed with care. This 

Possible Mitigation:

Drawback 2: It isn't human readable by default


# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
