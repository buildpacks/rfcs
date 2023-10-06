# Meta
[meta]: #meta
- Name: Buildpack Observability
- Start Date: 2022-10-05
- Author(s): @joshwlewis
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes leveraging [OpenTelemetry](https://opentelemetry.io/) to 
grant platform operators and buildpack operators more insight into buildpack 
performance and behavior. This RFC describes new opt-in functionality
for both pack and the buildpack spec such that OpenTelemetry data may be 
exported to the build file system.

# Definitions
[definitions]: #definitions

- [OpenTelemetry](https://opentelemetry.io/): A collection of APIs, SDKs, and tools that can be used it to instrument, generate, collect, and export telemetry data.
- [Traces](https://opentelemetry.io/docs/concepts/signals/traces/): Telemetry
  category that describes the path of software execution.


# Motivation
[motivation]: #motivation

Buildpack authors and platform operators desire insight into usage and
performance of builds and buildpacks on their platform. Questions like 
"How long does each buildpack compile phase take?", "Which buildpacks
commonly fail to compile?", "How often is a certain buildpack used?",
"Which versions of Go are being installed?", and "How long does it take to
download node_modules?" are important questions for authors and operators that
are currently difficult to answer.

Instrumenting lifecycle and buildpacks with opt-in OpenTelemetry tracing will
allow  platform operators to better understand performance and behavior of their 
builds and buildpacks and as a result, provide better service and build 
experiences.

To protect privacy and prevent unnecessary collection of data, this
functionality should be optional and anonymous.

# What it is
[what-it-is]: #what-it-is

This RFC aims to provide a solution for two types of OpenTelemetry traces:

1) Lifecycle tracing: Buildpack-agnostic trace data like which buildpacks were 
available, which buildpacks were detected, how long the detect, build, or 
export phase took, and so on. This telemetry data may be exported by lifecycle.
2) Buildpack tracing: Telemetry data specific to a buildpack like how long it
took to download a language binary, which language version was selected, and so
on. This telemetry data may be exported by buildpacks.

Though the sources and contents of the telemetry data differ, both types may
be emitted to the build file system in OpenTelemetry's [File Exporter
Format](https://opentelemetry.io/docs/specs/otel/protocol/file-exporter/).


For example, `lifecycle detector --telemetry` might save a file like this:

```json
{"resourceSpans":[{"resource":{"attributes":[{"key":"lifecycle.version","value":{"stringValue":"0.17.1"}}]},"scopeSpans":[{"scope":{},"spans":[{"traceId":"","spanId":"","parentSpanId":"","name":"buildpack-detect","startTimeUnixNano":"1581452772000000321","endTimeUnixNano":"1581452773000000789","droppedAttributesCount":1,"events":[{"timeUnixNano":"1581452773000000123","name":"detect-pass"}],"attributes":[{"key":"buildpack-id","value":{"stringValue":"heroku/nodejs-engine"}}],"droppedAttributesCount":2,"droppedEventsCount":1}]}]}]}
{ // additional spans... // }
```

And a buildpack's compile phase might save a file like this:

```json
{"resourceSpans":[{"resource":{"attributes":[{"key":"buildpack.version","value":{"stringValue":"1.0.0"}}]},"scopeSpans":[{"scope":{},"spans":[{"traceId":"","spanId":"","parentSpanId":"","name":"install-nodejs","startTimeUnixNano":"1581452772000001321","endTimeUnixNano":"1581452773000004789","droppedAttributesCount":1,"events":[{"timeUnixNano":"1581452773000002123","name":"restored-from-cache"}],"attributes":[{"key":"nodejs.version","value":{"stringValue":"20.0.0"}}]}]}]}]}
{ // additional spans... // }
```


# How it Works
[how-it-works]: #how-it-works

### Lifecycle telemetry files

If `lifecycle` is provided the telemetry opt-in flag (such as `--telemetry`),
`lifecycle` phases (such as `detect`, `build`, `export`) may emit an
OpenTelemetry File Export with tracing data to a known location, such as 
`/cnb/telemetry/lifecycle-detect.jsonl` with contents like this:

```json
{"resourceSpans":[{"resource":{"attributes":[{"key":"lifecycle.version","value":{"stringValue":"0.17.1"}}]},"scopeSpans":[{"scope":{},"spans":[{"traceId":"","spanId":"","parentSpanId":"","name":"buildpack-detect","startTimeUnixNano":"1581452772000000321","endTimeUnixNano":"1581452773000000789","droppedAttributesCount":1,"events":[{"timeUnixNano":"1581452773000000123","name":"detect-pass"}],"attributes":[{"key":"buildpack-id","value":{"stringValue":"heroku/nodejs-engine"}}],"droppedAttributesCount":2,"droppedEventsCount":1}]}]}]}
{ // additional spans... // }
```


### Buildpack telemetry files

During a buildpack's `detect` or `build` execution, a buildpack may emit
an OpenTelemetry File Export with tracing data to `/cnb/telemetry/#{buildpack-id}.jsonl`
with contents like this: 

```json
{"resourceSpans":[{"resource":{"attributes":[{"key":"lifecycle.version","value":{"stringValue":"0.17.1"}}]},"scopeSpans":[{"scope":{},"spans":[{"traceId":"","spanId":"","parentSpanId":"","name":"buildpack-detect","startTimeUnixNano":"1581452772000000321","endTimeUnixNano":"1581452773000000789","droppedAttributesCount":1,"events":[{"timeUnixNano":"1581452773000000123","name":"detect-pass"}],"attributes":[{"key":"buildpack-id","value":{"stringValue":"heroku/nodejs-engine"}}],"droppedAttributesCount":2,"droppedEventsCount":1}]}]}]}
{ // additional spans... // }
```

### Lifetime

The telemetry files may be written at any point during the build. They should
exist as a part of the build file system for the duration of the build.
Telemetry files will not be included in the final image.

### Access

The telemetry files should remain readable so that they may be analyzed by
the user and/or platform. However, they should be write protected in some way to prevent
malicious buildpacks from injecting tracing data into other buildpack's
telemetry file.


# Migration
[migration]: #migration

No migration neccessary, this is net-new functionality with no backwards
compatibilty concers.

# Drawbacks
[drawbacks]: #drawbacks

### Privacy Concerns

This RFC outlines functionality that could be percieved as user tracking. To
help remediate those concerns, these are some factors to remember about this
design:

1) This functionality is opt-in. `lifecycle` and `pack` will not emit telemetry
  data unless the `--telemetry` flag is used.
2) This functionality emits telemetry data only to the build file system. For
  `pack` users, the telemetry files are stored in docker volumes on the local
  machine. Neither `pack` nor `lifecycle` will "phone home" with telemety data.
3) Neither `pack` nor `lifecycle` collect user-identifiable data (no emails,
   usernames, IP addresses, etc.), so the telemetry data emitted by `lifecycle`
   will also be free of user-identifiaible data.

# Alternatives
[alternatives]: #alternatives

### OpenTelemetry Metrics

[Metrics](https://opentelemetry.io/docs/concepts/signals/metrics/) are another
category of telemetry data that could be used to answer questions about
build and buildpack behavior and performance. However, metrics are intended to
provide statistical information in aggregate. Since `lifecycle` and `pack`
only run one build at a time, there is no way to aggregate information about
multiple builds in `pack` or `lifecycle`.


# Prior Art
[prior-art]: #prior-art


- [Feature Request](https://github.com/buildpacks/lifecycle/issues/1208)
- [Slack
  Discussion](https://cloud-native.slack.com/archives/C033DV8D9FB/p1695144574408979)
Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What file paths should be used for lifecycle telemetry?
    - Does `lifecycle` emit files in other places that should be matched?

- What file paths should be used for buildpack telemetry?
    - `/layers` paths are not availble during detect, but `detect` tracing is
      desirable.
    - `/workspace` may not make sense, since telemetry files probably
      shouldn't be a part of the build result image.


- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Buildpack tracing file locations and format should be added to the [buildpack
specification](https://github.com/buildpacks/spec/blob/main/buildpack.md#build).

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
