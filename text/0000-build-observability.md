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
for pack, the lifecycle, and the buildpack spec such that OpenTelemetry data may be
exported to the build file system.

# Definitions
[definitions]: #definitions

- [OpenTelemetry](https://opentelemetry.io/): A collection of APIs, SDKs, and tools that can be used it to instrument, generate, collect, and export telemetry data.
- [Traces](https://opentelemetry.io/docs/concepts/signals/traces/): Telemetry
  category that describes the path of software execution.


# Motivation
[motivation]: #motivation

Buildpack authors and platform operators desire insight into usage, error
scenarios, and performance of builds and buildpacks on their platform. The
following questions are all important for these folks, but difficult to answer:

- "Which buildpacks commonly fail to compile?"
- "How often does a particular error scenario occur?"
- "How long does each buildpack compile phase take?"
- "How often is a certain buildpack used?"
- "Which versions of Go are being installed?"
- "How long does it take to download node_modules?"

Instrumenting lifecycle and buildpacks with opt-in OpenTelemetry tracing will
allow  platform operators to better understand performance and behavior of their
builds and buildpacks and as a result, provide better service and build
experiences.

To protect privacy and prevent unnecessary collection of data, this
functionality shall be optional and anonymous.

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

In this solution, each lifecycle phase would write a `.jsonl` file with
tracing data for that phase. For example, `lifecycle detector --telemetry`
would write to `/layers/tracing/lifecycle/detect.jsonl`. Additionally each
buildpack may also write tracing data to it's own `.jsonl` files (at
`/layers/tracing/buildpacks/#{id}@#{version}-#{phase}.jsonl`).

These `.jsonl` files may be read by platform operators for consumption,
transformation, enrichment, and/or export to an OpenTelemetry backend. Given
that builds may crash or fail at any point, these files must be written to
often and regularly to prevent data loss.

Platform operators will likely want to view or analyze this data. These
telemetry files are in OTLP compatible format, so may be exported to one or
more OpenTelemetry backends like Honeycomb, Prometheus, and [many
others](https://opentelemetry.io/ecosystem/vendors/).

Additionally, these traces may be correlated with traces in a platform
operator's system via context propagation. The `CNB_OTEL_TRACEPARENT` may be
provided by a platform to the build environment, such that generated traces
inherit `trace-id` and `parent-id` from platform systems.

# How it Works
[how-it-works]: #how-it-works

### Lifecycle telemetry files

If `lifecycle` is provided the telemetry opt-in flag (such as `--telemetry`),
`lifecycle` phases (such as `detect`, `build`, `export`) may emit an
OpenTelemetry File Export with tracing data to a known location, such as
`/layers/tracing/lifecycle/detect.jsonl` with contents like this:

```json
{
  "resourceSpans": [
    {
      "resource": {
        "attributes": [
          {
            "key": "lifecycle.version",
            "value": {
              "stringValue": "0.17.1"
            }
          }
        ]
      },
      "scopeSpans": [
        {
          "scope": {},
          "spans": [
            {
              "traceId": "",
              "spanId": "",
              "parentSpanId": "",
              "name": "buildpack-detect",
              "startTimeUnixNano": "1581452772000000321",
              "endTimeUnixNano": "1581452773000000789",
              "droppedAttributesCount": 2,
              "events": [
                {
                  "timeUnixNano": "1581452773000000123",
                  "name": "detect-pass"
                }
              ],
              "attributes": [
                {
                  "key": "buildpack-id",
                  "value": {
                    "stringValue": "heroku/nodejs-engine"
                  }
                }
              ],
              "droppedEventsCount": 1
            }
          ]
        }
      ]
    }
  ]
}
```


### Buildpack telemetry files

During a buildpack's `detect` and/or `build` execution, a buildpack may emit
an OpenTelemetry File Export with tracing data to `/layers/tracing/buildpacks/#{id}@#{version}-#{phase}.jsonl`
with contents like this:

```json
{
  "resourceSpans": [
    {
      "resource": {
        "attributes": [
          {
            "key": "lifecycle.version",
            "value": {
              "stringValue": "0.17.1"
            }
          }
        ]
      },
      "scopeSpans": [
        {
          "scope": {},
          "spans": [
            {
              "traceId": "",
              "spanId": "",
              "parentSpanId": "",
              "name": "buildpack-detect",
              "startTimeUnixNano": "1581452772000000321",
              "endTimeUnixNano": "1581452773000000789",
              "droppedAttributesCount": 2,
              "events": [
                {
                  "timeUnixNano": "1581452773000000123",
                  "name": "detect-pass"
                }
              ],
              "attributes": [
                {
                  "key": "buildpack-id",
                  "value": {
                    "stringValue": "heroku/nodejs-engine"
                  }
                }
              ],
              "droppedEventsCount": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Location

All tracing files should be written to `/layers/tracing/`. Lifecycle execution
traces should be written to `/layers/tracing/lifecycle/{phase}.jsonl`.
Buildpack traces may be written to
`/layers/tracing/buildpacks/{id}@{version}-{phase}.jsonl`.
Extension traces may be written to
`/layers/tracing/extensions/{id}@{version}-{phase}.jsonl`.

A completed build with tracing might have a tracing file hierarchy like this:

```
<layers>
└── tracing
    ├── buildpacks
    │   ├── other-id@other-version-detect.jsonl
    │   ├── some-id@some-version-build.jsonl
    │   └── some-id@some-version-detect.jsonl
    ├── extensions
    │   ├── some-id@some-version-detect.jsonl
    │   └── some-id@some-version-generate.jsonl
    └── lifecycle
        ├── analyze.jsonl
        ├── build.jsonl
        ├── detect.jsonl
        ├── export.jsonl
        ├── extend.jsonl
        └── restore.jsonl
```

### Lifetime

Telemetry files may be written at any point during the build, so that they
are persisted in cases of failures to detect, failures to build, process
terminations, or crashes. The `jsonl` format allows telemetry libraries to
safely append additional json objects to the end of a telemetry file, so
telemetry data can be flushed to the file frequently. Telemetry files should
not be truncated or deleted so that telemetry processing by a platform can
happen during or after a build. Telemetry files should not be included in the
build result, as they are not relevant, and would likely negatively impact
image size and reproduceability.

### Access

The telemetry files should be group readable so that they may be analyzed by
the user and/or platform during and/or after the build. The telemetry files
must also be group readable so that buildpacks and lifecycle can write to them,
but buildpacks and the lifecycle shall read and write only their own files.

### Context Propagation

To allow correlation of lifecycle and buildpack traces to traces in platform
operator's systems, `CNB_OTEL_TRACEPARENT` may be provided for `lifecycle` and
buildpacks. The value of this env var should follow
[W3C Trace Context specification for traceparent field values](https://www.w3.org/TR/trace-context/#traceparent-header-field-values).
If provided, generated traces by lifecycle and buildpacks shall inherit the
`trace-id` and `parent-id` provided therein.

### Consumption

This RFC leaves the consumption of telemetry files to the platform operator.
Platform operators choosing to use these metrics may read them either during
or after the build. This can be done using existing OpenTelemetry libraries.
Platform operators may choose to optionally enrich or modify the tracing data
as they see fit (with data like `instance_id` or `build_id`). Platform
operators will likely want to export this data to an OpenTelemetry backend for
persistence and analysis, and again, this may be done with existing
OpenTelemetry libraries.

### Viewing and Analyzing

Once the lifecycle and buildpack traces are exported to an OpenTelemetry
backend, platform operators should be able to (depending on the features of the
backend):

- View the complete trace for a build
- View or query attributes attached to spans (e.g. `buildpack_id`,
  `nodejs_version`)
- View or query span durations
- View or query error types and/or messages
- and more

### Intent

The purpose and intent of these files is to provide anonymous build
observability data for users and platform operators. These files shall not
be used for other intents. For example:

- These files shall not be used as an API, contract, or communication mechanism
  between buildpacks.
- These files shall not record any personally identifiable information (such
  as usernames, email addresses, IP Addresses, etc.).
- These files shall not record any potentially business sensitive information
  (such as passwords, access keys, resulting image name and/or urls, source
  code repository name, etc.).

# Migration
[migration]: #migration

No migration neccessary, this is net-new functionality with no backwards
compatibilty concerns.

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
3) Neither `pack` nor `lifecycle` collect personally identifiable information
   (no emails, usernames, passwords, IP addresses, etc.).

### File Export Format Status

While the [File Exporter
Format](https://opentelemetry.io/docs/specs/otel/protocol/file-exporter/) is
an official format, and matches the OTLP format nearly exactly (and thus seems
unlikely to change), it is listed as experimental status.


### Additional restricted layer name

This RFC introduces `/layers/tracing/`. This means that buildpack authors will
be unable to use this directory as a <layer_dir>, and lifecycle will need to
prevent usage of this directory.

# Alternatives
[alternatives]: #alternatives

### OpenTelemetry Metrics

[Metrics](https://opentelemetry.io/docs/concepts/signals/metrics/) are another
category of telemetry data that could be used to answer questions about
build and buildpack behavior and performance. However, metrics are intended to
provide statistical information in aggregate. Since `lifecycle` and `pack`
only run one build at a time, there is no way to aggregate information about
multiple builds in `pack` or `lifecycle`.

### OTLP

The [OpenTelemetryProtocol](https://opentelemetry.io/docs/specs/otlp/) is a
network delivery protocol for OpenTelemetry data. Instead of emitting files as
this RFC describes, lifecycle and buildpacks could instead connect to an
OpenTelemetry collector provided by the platform operator. This pattern is
well supported and well known.

However, there are drawbacks:

- In local `pack build` scenarios, it's unlikely that users would have an
  OpenTelemetry collector running. This RFC solution does not require a
  collector.
- lifecycle and buildpacks would need to know where the OpenTelemetry collector
  is and how to authenticate with it. Lifecycle and buildpacks that wish to
  emit telemetry may not want to deal with the mountain of configuration to
  support various collectors.
- Platform operators may have complex network topology that may make supporting
  this feature challenging (e.g. a firewall between lifecycle and the collector
  may still be perceived as a lifecycle malfunction).

There is an [RFC for this alternative](https://github.com/buildpacks/rfcs/pull/300).

# Prior Art
[prior-art]: #prior-art


- [Feature Request](https://github.com/buildpacks/lifecycle/issues/1208)
- [Slack
  Discussion](https://cloud-native.slack.com/archives/C033DV8D9FB/p1695144574408979)
Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions


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
