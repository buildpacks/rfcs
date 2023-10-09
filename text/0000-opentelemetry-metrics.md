# Meta
[meta]: #meta
- Name: Enable OpenTelemetry Metrics
- Start Date: 2023-10-09
- Author(s): qiaoleiatms
- Status: Draft <!-- Acceptable values: Draft, Approved, On Hold, Superseded -->
- RFC Pull Request: 
- CNB Pull Request: 
- CNB Issue: 
- Supersedes: N/A

# Summary
[summary]: #summary

The lifecycle should support to collect metrics about phases and buildpacks.

# Motivation
[motivation]: #motivation

As a service provider who provides the build functionalities to the end users by leveraging CNB buildpacks, it's not easy to know the service running state in real-time.

To support send metrics will give us a chance to understand how the service is running and how to improve the availability.

# What it is
[what-it-is]: #what-it-is


This RFC proposes to collect metrics over OpenTelemetry (Also known as [OTel](https://opentelemetry.io/docs/what-is-opentelemetry/), an `Observebility` framework for metrics, tracing and logging.)
  - Metrics of phases
  - Metrics of buildpacks

And then, send the metrics to the supported [exporters](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter)


# How it Works
[how-it-works]: #how-it-works

- Metrics of phases - For each phase, should define at least below metrics
  - Count of phase been executed
  - Success count of phase been executed
  - Time duration of phase been executed
- Metrics of buildpacks - For each buildpack participates in build phase, should define at least below metrics
  - Count of buildpack been executed
  - Success count of buildpack been executed
  - Time duration of buildpack been executed
- By default, the metrics collection could be disabled, unless a flag `CNB_METRICS_ENABLED=true` is given.
- If metrics collection is enabled, by default, the metrics should send to the console, unless a flag `CNB_METRICS_EXPORTER=xxx` is configured to send metrics to a supported [exporters](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter), and should support the most popular ones in priority:
  - prometheusexporter
  - influxdbexporter
  - kafkaexporter
  - zipkinexporter
  - fileexporter
  - azuredataexplorerexporter
  - azuremonitorexporter
  - dynatraceexporter
  - opencensusexporter
  - splunkhecexporter
  - datadogexporter
- Configuration of different exporters should be able to be defined in file ([example](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/fileexporter/README.md#example)) and pass to lifecycle during `pack build`
  
    `pack build --builder {builder_name} -p {path_to_source} --exporter-conf {path_to_conf}`

# Migration
[migration]: #migration

N/A

# Drawbacks
[drawbacks]: #drawbacks

If we don't, there's no way for service owner/provider to know the overall status of build.

# Alternatives
[alternatives]: #alternatives


Instead, lifecycle should generate the parsable report of phases and buildpacks, for example:

```json
{
    "phases": [
        {"phase": "analyze", "executed": "true", "succeeded": true, "durationInMs": "3456"},
        {"phase": "detect", "executed": "true", "succeeded": true, "durationInMs": "3456"},
        {"phase": "restore", "executed": "true", "succeeded": true, "durationInMs": "3456"},
        {"phase": "build", "executed": "true", "succeeded": false, "durationInMs": "3456", error: "...error message.."}
        {"phase": "export", "executed": "false", "succeeded": false, "durationInMs": "0"}
        ...
    ],
    "buildpacks": [
        {"id": "paketo-buildpacks/maven", "executed": "true", "succeeded": true, "durationInMs": "3456"},
        {"id": "paketo-buildpacks/openjdk", "executed": "true", "succeeded": true, "durationInMs": "3456"},
        {"id": "paketo-buildpacks/executable-jar", "executed": "true", "succeeded": false, "durationInMs": "3456", error: "...error message..."},
        {"id": "paketo-buildpacks/syft", "executed": "false", "succeeded": false, "durationInMs": "0"}
        ...
    ]
}
```

Meanwhile, a `collect` phase should be supported by buildpack extension to collect the report file.

# Prior Art
[prior-art]: #prior-art

N/A

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A


# History
[history]: #history

N/A