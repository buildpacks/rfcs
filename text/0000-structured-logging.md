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


### `analyzer`

#### Before

```
Analyzing image "aca0be5808b3cbb89e7e69e8ccc3c7bf50edfab5679d860cdd20b02d6013b096"
Restoring metadata for "org.cloudfoundry.node-engine:node" from app image
Writing layer metadata for "org.cloudfoundry.node-engine:node"
Restoring metadata for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed" from cache
Writing layer metadata for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed"
Not restoring "org.cloudfoundry.node-engine:node" from cache, marked as launch=true
Restoring metadata for "org.cloudfoundry.npm:node_modules" from app image
Writing layer metadata for "org.cloudfoundry.npm:node_modules"
Restoring metadata for "org.cloudfoundry.npm:cache" from cache
Writing layer metadata for "org.cloudfoundry.npm:cache"
Not restoring "org.cloudfoundry.npm:node_modules" from cache, marked as launch=true
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
Restoring data for "org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed" from cache
Restoring data for "org.cloudfoundry.node-engine:node" from cache
Restoring data for "org.cloudfoundry.npm:cache" from cache
Restoring data for "org.cloudfoundry.npm:node_modules" from cache
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
-----> Node Engine Buildpack &{[34] <nil>}
  Node Engine 12.14.0: Reusing cached layer
-----> NPM Buildpack &{[34] <nil>}
  Node Modules b5323d7c9de54a883c5b5472b7a1d89aa8f6fc857b3206a5d3fe96f73e14b2c2: Contributing to layer
It is recommended to vendor the application's Node.js dependencies
running npm install
Reusing existing node_modules
audited 302 packages in 2.182s
found 0 vulnerabilities

Cache verified and compressed (/layers/org.cloudfoundry.npm/cache/npm-cache/_cacache):
Content verified: 200 (2550658 bytes)
Index entries: 340
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
```
Reusing layers from image with id '68c40bbf412bd8ed2a9bb9bac8e6508f6f1be3115c4385e00c13d1efe4e32c38'
Reusing layer 'launcher'
Layer 'launcher' SHA: sha256:e19184b1a3252d16afbdc481d16e577afaf55d8095078efc53b9eb8d4e946eae
Reusing layer 'org.cloudfoundry.node-engine:node'
Layer 'org.cloudfoundry.node-engine:node' SHA: sha256:189b7d6858101945bbe5ac839b966136b8781dcd40b8473b7b657c4199f4f888
Adding layer 'org.cloudfoundry.npm:node_modules'
Layer 'org.cloudfoundry.npm:node_modules' SHA: sha256:869d2fb3a5e27adab1218ee042f99955756fdd08fa2c1585dc2692631c9d7997
Layer 'app' SHA: sha256:ef425ede8b461a209993ed95efba050c162093331c87cb730df04cbe95e293e3
Reusing 1/1 app layer(s)
Reusing layer 'config'
Layer 'config' SHA: sha256:210aee34f63c10233a0e0ac9230b742de9511197933ca889d661c7f893fcfcab
*** Images (8f6be2b444ea):
      index.docker.io/library/node:latest

*** Image ID: 8f6be2b444eaef1b8383964f8bff3690b8b79eaaf959bb12e358ffd14cd0038c
Reusing cache layer 'org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed'
Layer 'org.cloudfoundry.node-engine:52207f643ab0fba66d5189a51aac280c4834c81f24a7297446896386ec93a5ed' SHA: sha256:1a496fa202b8c5e4bd94755b388d5be2d64b6b8554d9b45dc801fa974fa01de9
Reusing tarball for layer "org.cloudfoundry.node-engine:node" with SHA: sha256:189b7d6858101945bbe5ac839b966136b8781dcd40b8473b7b657c4199f4f888
Reusing cache layer 'org.cloudfoundry.node-engine:node'
Layer 'org.cloudfoundry.node-engine:node' SHA: sha256:189b7d6858101945bbe5ac839b966136b8781dcd40b8473b7b657c4199f4f888
Writing tarball for layer "org.cloudfoundry.npm:cache"
Adding cache layer 'org.cloudfoundry.npm:cache'
Layer 'org.cloudfoundry.npm:cache' SHA: sha256:e4a3173bbec7ad71f90a4e8a70aba4d21a9661393ef9ef94911b1ddce34caa0d
Reusing tarball for layer "org.cloudfoundry.npm:node_modules" with SHA: sha256:869d2fb3a5e27adab1218ee042f99955756fdd08fa2c1585dc2692631c9d7997
Adding cache layer 'org.cloudfoundry.npm:node_modules'
Layer 'org.cloudfoundry.npm:node_modules' SHA: sha256:869d2fb3a5e27adab1218ee042f99955756fdd08fa2c1585dc2692631c9d7997
```

#### After

```json
{"level": "info", "phase": "export", "action": "reuse", "data": {"layer": {"type": "launcher","diffID": "sha256:e19184b1a3252d16afbdc481d16e577afaf55d8095078efc53b9eb8d4e946eae"}}}
{"level": "info", "phase": "export", "action": "reuse", "data": {"layer": {"type": "buildpack", "buildpack": "org.cloudfoundry.node-engine", "name": "node", "diffID": "sha256:189b7d6858101945bbe5ac839b966136b8781dcd40b8473b7b657c4199f4f888"}}}
{"level": "info", "phase": "export", "action": "add", "data": {"layer": {"type": "buildpack", "buildpack": "org.cloudfoundry.npm", "name": "node_modules", "diffID": "sha256:869d2fb3a5e27adab1218ee042f99955756fdd08fa2c1585dc2692631c9d7997"}}}
{"level": "info", "phase": "export", "action": "add", "data": {"layer": {"type": "app", "index": 1, "diffID": "sha256:210aee34f63c10233a0e0ac9230b742de9511197933ca889d661c7f893fcfcab"}}}
{"level": "info", "phase": "export", "action": "write", "data": {"image": {"ref": "8f6be2b444ea", "tags": ["index.docker.io/library/node:latest"]}}}
{"level": "info", "phase": "export", "action": "reuseCache", "data": {"image": {"id": "8f6be2b444ea", "tags": ["index.docker.io/library/node:latest"]}}}
{"level": "info", "phase": "export", "action": "reuseCache", "data": {"image": {"id": "8f6be2b444ea", "tags": ["index.docker.io/library/node:latest"]}}}
```


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
