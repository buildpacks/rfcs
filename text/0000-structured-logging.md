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

The format of 

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
[analyzer] Analyzing image "aca0be5808b3cbb89e7e69e8ccc3c7bf50edfab5679d860cdd20b02d6013b096"
[analyzer] Restoring metadata for "org.cloudfoundry.node-engine:node" from app image
[analyzer] Writing layer metadata for "org.cloudfoundry.node-engine:node"
[analyzer] Restoring metadata for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed" from cache
[analyzer] Writing layer metadata for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed"
[analyzer] Not restoring "org.cloudfoundry.node-engine:node" from cache, marked as launch=true
[analyzer] Restoring metadata for "org.cloudfoundry.npm:node_modules" from app image
[analyzer] Writing layer metadata for "org.cloudfoundry.npm:node_modules"
[analyzer] Restoring metadata for "org.cloudfoundry.npm:cache" from cache
[analyzer] Writing layer metadata for "org.cloudfoundry.npm:cache"
[analyzer] Not restoring "org.cloudfoundry.npm:node_modules" from cache, marked as launch=true
```

#### After

```json
{"level": "verbose", "phase": "analyze", "progress": {"message": "Analyzing image \"aca0be5808b3cbb89e7e69e8ccc3c7bf50edfab5679d860cdd20b02d6013b096\""}
{"level": "info", "phase": "analyze", "progress": {"message": "Restoring metadata for \"org.cloudfoundry.node-engine:node\" from app image"}
{"level": "verbose", "phase": "analyze", "progress": {"message": "Writing layer metadata for \"org.cloudfoundry.node-engine:node\""}
{"level": "info", "phase": "analyze", "progress": {"message": "Restoring metadata for \"org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed\" from cache"}
{"level": "verbose", "phase": "analyze", "progress": {"message": "Writing layer metadata for \"org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed\""}
{"level": "verbose", "phase": "analyze", "progress": {"message": "Not restoring \"org.cloudfoundry.node-engine:node\" from cache, marked as launch=true"}
{"level": "info", "phase": "analyze", "progress": {"message": "Restoring metadata for \"org.cloudfoundry.npm:node_modules\" from app image"}
{"level": "verbose", "phase": "analyze", "progress": {"message": "Writing layer metadata for \"org.cloudfoundry.npm:node_modules\""}
{"level": "info", "phase": "analyze", "progress": {"message": "Restoring metadata for \"org.cloudfoundry.npm:cache\" from cache"}
{"level": "verbose", "phase": "analyze", "progress": {"message": "Not restoring \"org.cloudfoundry.npm:node_modules\" from cache, marked as launch=true"}
{"level": "info", "phase": "analyze", "summary": {"image": "aca0be5808b3cbb89e7e69e8ccc3c7bf50edfab5679d860cdd20b02d6013b096", "metadata": { "fromLaunch": [{"buildpackID": "org.cloudfoundry.node-engine", "name": "node"}, {"buildpackID": "org.cloudfoundry.npm", "name": "node_modules"}], "fromCache": [{"buildpackID": "org.cloudfoundry.node-engine", "name": "52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed"}, {"buildpackID": "org.cloudfoundry.npm", "name": "node_modules"}]}}
```
### `restorer`

#### Before
```
[restorer] Restoring data for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed" from cache
[restorer] Restoring data for "org.cloudfoundry.node-engine:node" from cache
[restorer] Restoring data for "org.cloudfoundry.npm:cache" from cache
[restorer] Restoring data for "org.cloudfoundry.npm:node_modules" from cache
```

#### After
```json
{"level": "info", "phase": "restore", "progress": {"message": "Restoring data for \"org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed\" from cache"}
{"level": "info", "phase": "restore", "progress": {"message": "Restoring data for \"org.cloudfoundry.node-engine:node\" from cache"}
{"level": "info", "phase": "restore", "progress": {"message": "Restoring data for \"org.cloudfoundry.npm:node_modules\" from cache"}
{"level": "info", "phase": "restore", "summary": {"layers": [{"buildpackID": "org.cloudfoundry.node-engine", "name": "52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed"},{"buildpackID": "org.cloudfoundry.node-engine", "name": "node"},{"buildpackID": "org.cloudfoundry.npm", "name": "node_modules"}]}
```

### `builder`

#### Before
```
[builder] -----> Node Engine Buildpack &{[34] <nil>}
[builder]   Node Engine 12.14.0: Reusing cached layer
[builder] -----> NPM Buildpack &{[34] <nil>}
[builder]   Node Modules b5323d7c9de54a883c5b5472b7a1d89aa8f6fc857b3206a5d3fe96f73e14b2c2: Contributing to layer
[builder] It is recommended to vendor the application's Node.js dependencies
[builder] running npm install
[builder] Reusing existing node_modules
[builder] audited 302 packages in 2.182s
[builder] found 0 vulnerabilities
[builder]
[builder] Cache verified and compressed (/layers/org.cloudfoundry.npm/cache/npm-cache/_cacache):
[builder] Content verified: 200 (2550658 bytes)
[builder] Index entries: 340
...
```

#### After
```json
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.node-engine", "version": "0.0.133"}, "stdout":  "-----> Node Engine Buildpack &{[34] <nil>}"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.node-engine", "version": "0.0.133"}, "stdout":  "  Node Engine 12.14.0: Reusing cached layer"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "-----> NPM Buildpack &{[34] <nil>}"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "  Node Modules b5323d7c9de54a883c5b5472b7a1d89aa8f6fc857b3206a5d3fe96f73e14b2c2: Contributing to layer"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "It is recommended to vendor the application's Node.js dependencies"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "running npm install"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "Reusing existing node_modules"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "found 0 vulnerabilities"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  ""}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "Cache verified and compressed (/layers/org.cloudfoundry.npm/cache/npm-cache/_cacache):"}
{"level": "info", "phase": "build", "buildpack": {"id": "org.cloudfoundry.npm", "version": "0.0.83"}, "stdout":  "Index entries: 340"}
...
```

### `exporter`

#### Before

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
