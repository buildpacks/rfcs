# Meta
[meta]: #meta
- Name: Increase Build Plan Flexibility
- Start Date: 2020-05-28
- Author(s): nebhale
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

This RFC proposes removing the `version` key as a top-level key to properly reflect its importance in the broader buildpack ecosystem while continuing to allow buildpacks that do manage version metadata collaboration between buildpack to do so via the existing metadata mechanism.

# Motivation
[motivation]: #motivation

Currently, the [build plan](https://github.com/buildpacks/spec/blob/master/buildpack.md#build-plan-toml) and the related [buildpack plan](https://github.com/buildpacks/spec/blob/master/buildpack.md#buildpack-plan-toml) are manifestations of the whiteboard pattern.  This pattern allows buildpacks to read and write arbitrary data both for themselves between detect and build times and between different buildpacks at build time.  This flexibility is _really_ important for innovation given that we cannot predict today, all of the novel ways buildpacks would want to communicate with themselves or other buildpacks.

The one place where this flexibility is constrained is that `version` has been promoted to be a top-level key.  Given that so many buildpacks do not require `version` to be set in their interactions with other buildpacks, and the fact that in practice, there are only a very small number of actors (the original source code, the application developer explicitly) that can reasonably request a particular version, this elevation of the key reduces flexibility.

# What it is
[what-it-is]: #what-it-is

The `version` key should be removed as a top-level entry in both the build plan and buildpack plan.  Buildpacks that need to coordinate versions from other parties should use an agreed upon metadata key (the conventional, but not required, choice is `version`) to replicate their existing functionality.  The BOM schema will be updated to remove `version` as a top-level key as well, to match its relation to the buildpack plan.

The `lifecycle` is required to implement temporary compatibility with the previous build plan and buildpack plan structure by converting the `version` key in `metadata` into and out of a top-level key at the appropriate locations.

# How it Works
[how-it-works]: #how-it-works

N/A

# Drawbacks
[drawbacks]: #drawbacks

The primary drawback to this RFC is that it is a breaking API change.

The secondary drawback is that without a top-level key, buildpack authors that would like collaborate on versions would need to read documentation from the buildpack they wish to collaborate with to determine the name of the key used for collaboration.  Given that that author would need to read the buildpack's documentation to determine if it honored the top-level `version` key today, it's unclear if this is a significant change.

# Alternatives
[alternatives]: #alternatives

This RFC is a competing proposal to the [Build Plan Merging RFC](https://github.com/buildpacks/rfcs/pull/67).  That RFC's proposal (as it stands today) is directionally different as its goal is to ensure clarity between collaborators by increasing the amount of structure in the build plan and buildpack plan.  The choice for which one of these two proposals is "best" depends directly on your view of the usage of the plans.

The impact of not making this change is negligible as many buildpacks simply ignore the key completely.

# Prior Art
[prior-art]: #prior-art

A non-exhaustive list of buildpacks from the Paketo project, the riff project, and distributed commercially by VMware (Tanzu-branded) represents a cross-section of buildpack implementations.

Uses `version`:

  * [`paketo-buildpacks/dotnet-core-aspnet`](https://github.com/paketo-buildpacks/dotnet-core-aspnet)
  * [`paketo-buildpacks/dotnet-core-runtime`](https://github.com/paketo-buildpacks/dotnet-core-runtime)
  * [`paketo-buildpacks/dotnet-core-sdk`](https://github.com/paketo-buildpacks/dotnet-core-sdk)
  * [`paketo-buildpacks/go-compiler`](https://github.com/paketo-buildpacks/go-compiler)
  * [`paketo-buildpacks/httpd`](https://github.com/paketo-buildpacks/httpd)
  * [`paketo-buildpacks/nginx`](https://github.com/paketo-buildpacks/nginx)
  * [`paketo-buildpacks/node-engine`](https://github.com/paketo-buildpacks/procfile)
  * [`paketo-buildpacks/npm`](https://github.com/paketo-buildpacks/npm)
  * [`paketo-buildpacks/php-composer`](https://github.com/paketo-buildpacks/php-composer)
  * [`paketo-buildpacks/php-dist`](https://github.com/paketo-buildpacks/php-dist)
  * [`paketo-buildpacks/php-web`](https://github.com/paketo-buildpacks/php-web)
  * [`paketo-buildpacks/yarn-install`](https://github.com/paketo-buildpacks/yarn-install)

Does **not** use `version`:

  * [`paketo-buildpacks/adopt-openjdk`](https://github.com/paketo-buildpacks/adopt-openjdk)
  * [`paketo-buildpacks/amazon-corretto`](https://github.com/paketo-buildpacks/amazon-corretto)
  * [`paketo-buildpacks/apache-tomcat`](https://github.com/paketo-buildpacks/apache-tomcat)
  * [`paketo-buildpacks/azul-zulu`](https://github.com/paketo-buildpacks/azul-zulu)
  * [`paketo-buildpacks/azure-application-insights`](https://github.com/paketo-buildpacks/azure-application-insights)
  * [`paketo-buildpacks/bellsoft-liberica`](https://github.com/paketo-buildpacks/bellsoft-liberica)
  * [`paketo-buildpacks/debug`](https://github.com/paketo-buildpacks/debug)
  * [`paketo-buildpacks/dep`](https://github.com/paketo-buildpacks/dep)
  * [`paketo-buildpacks/dist-zip`](https://github.com/paketo-buildpacks/dist-zip)
  * [`paketo-buildpacks/dotnet-core-build`](https://github.com/paketo-buildpacks/dotnet-core-build)
  * [`paketo-buildpacks/dotnet-core-conf`](https://github.com/paketo-buildpacks/dotnet-core-conf)
  * [`paketo-buildpacks/eclipse-openj9`](https://github.com/paketo-buildpacks/eclipse-openj9)
  * [`paketo-buildpacks/encrypt-at-rest`](https://github.com/paketo-buildpacks/encrypt-at-rest)
  * [`paketo-buildpacks/executable-jar`](https://github.com/paketo-buildpacks/executable-jar)
  * [`paketo-buildpacks/go-mod`](https://github.com/paketo-buildpacks/go-mod)
  * [`paketo-buildpacks/google-stackdriver`](https://github.com/paketo-buildpacks/google-stackdriver)
  * [`paketo-buildpacks/graalvm`](https://github.com/paketo-buildpacks/graalvm)
  * [`paketo-buildpacks/gradle`](https://github.com/paketo-buildpacks/gradle)
  * [`paketo-buildpacks/image-labels`](https://github.com/paketo-buildpacks/image-labels)
  * [`paketo-buildpacks/jmx`](https://github.com/paketo-buildpacks/jmx)
  * [`paketo-buildpacks/maven`](https://github.com/paketo-buildpacks/maven)
  * [`paketo-buildpacks/procfile`](https://github.com/paketo-buildpacks/procfile)
  * [`paketo-buildpacks/sap-machine`](https://github.com/paketo-buildpacks/sap-machine)
  * [`paketo-buildpacks/sbt`](https://github.com/paketo-buildpacks/sbt)
  * [`paketo-buildpacks/spring-boot`](https://github.com/paketo-buildpacks/spring-boot)
  * [`projectriff/command-function`](https://github.com/projectriff/command-function-buildpack)
  * [`projectriff/java-function`](https://github.com/projectriff/java-function-buildpack)
  * [`projectriff/node-function`](https://github.com/projectriff/node-function-buildpack)
  * [`projectriff/streaming-http-adapter`](https://github.com/projectriff/streaming-http-adapter-buildpack)
  * `tanzu-buildpacks/apache-skywalking`
  * `tanzu-buildpacks/appdynamics`
  * `tanzu-buildpacks/aspectj`
  * `tanzu-buildpacks/ca-apm`
  * `tanzu-buildpacks/checkmarx`
  * `tanzu-buildpacks/contrast-security`
  * `tanzu-buildpacks/dynatrace`
  * `tanzu-buildpacks/elastic-apm`
  * `tanzu-buildpacks/jacoco`
  * `tanzu-buildpacks/jprofiler`
  * `tanzu-buildpacks/jrebel`
  * `tanzu-buildpacks/new-relic`
  * `tanzu-buildpacks/overops`
  * `tanzu-buildpacks/riverbed`
  * `tanzu-buildpacks/snyk`
  * `tanzu-buildpacks/synopsys`
  * `tanzu-buildpacks/yourkit`

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

N/A
