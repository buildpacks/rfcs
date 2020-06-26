# Meta
[meta]: #meta
- Name: Service Binding
- Start Date: 2019-08-06
- CNB Pull Request: [rfcs#22](https://github.com/buildpacks/rfcs/pull/22), [spec#57](https://github.com/buildpacks/spec/pull/57)
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

One of the common uses of buildpacks is to configure applications to run against remote "services" (a useful name, with perhaps too much baggage) such as APMs and RDBMSs.  In order to do this, the buildpacks need to know about the credentials (e.g. endpoint, username, password) required to connect to those services.  In order to make buildpacks portable and generically useful, these service credentials should be exposed in a standard way on all CNB-compliant platforms.

# Motivation
[motivation]: #motivation

Currently, the specification describes a `CNB_SERVICES` environment variable, but does not describe what the payload should be.  This was always meant as a placeholder and as we approach 1.0, it should be completed with a more concrete description of where service bindings should be found and what their payloads should be.

A complete service binding specification should enable buildpacks to determine what functionality an application developer would like to contribute (binding signals intent) and automatically do some or all of the following (not complete):

  * Provision a binary agent at build time
  * Configure an integration at runtime
  * Scan incoming code for service vulnerabilities

Describing a standardized service binding mechanism will allow buildpacks supporting service-based functionality (e.g APMs, auto-reconfiguration of RDBMS connections) to work across multiple platforms, each with their own ideas of how services are provisioned and credentials are managed, through a unified abstraction.

# What it is
[what-it-is]: #what-it-is

Service binding is a way to expose credential information (e.g. endpoint, username, password) about an external "service" in a unified way.  This isn't a specification of how services are managed at the platform level, but rather a specification about how information about those managed services are exposed to buildpacks and applications.

Examples:

  * A _user_ would like to bind their application to the New Relic APM.  In order for a _buildpack_ to perform this integration, it would need to know that a New Relic service was bound to the application.  As part of that binding, the "license key" for the New Relic account would be exposed, along with other arbitrary configuration.
  * A _user_ would like to bind their application to an RDBMS.  In order for an _application_ to perform this integration, it would need to know that an RDBMS was bound to the application.  As part of that binding, the host, port, username, password, database, and connection limit would be exposed.
  * An _enterprise_ would like all applications to be scanned for security vulnerabilities with Snyk before staging.  In order for a _buildpack_ to perform this scan, it would need to know that a Snyk service was bound to the application.  As part of that binding, the URI, organization, API token, whether to break the build, and severity threshold would be exposed.

# How it Works
[how-it-works]: #how-it-works

As the cloud native community, and especially the Kubernetes community, has evolved over the last couple of years, the use of environment variables to communicate service information (most specifically secrets) has become an anti-pattern.  There are a number of drawbacks to using environment variables when it comes to visibility, but the biggest reason for not using them is that values that represent credentials cannot be rotated without restarting a process.  Instead, the community is rapidly coalescing around mounting filesystems (typically, but not exclusively, based on `tempfs`) containing files with secrets contained within them.

For example Kubernetes makes possible (and prefers) [mounting secrets as files][f] and has a number of strategies for [protecting those files][p] on disk.  Cloud Foundry uses a similar mechanism to [expose and rotate cryptographic instance identity][i] within containers.  This is not to say that all platforms must implement secrets in the same way, but rather that it has become a common pattern that the community prefers.

It should be noted that this specification does not describe the contents of the secret files on the filesystem.  While files in `tempfs` with proper permissions are generally considered safe enough for secret exposure, in cases where extreme security is required those files could contain pointers to a secret store that are resolved at runtime instead of the values of the secrets themselves.  For example, the contents of a secret file could have `credhub://bhale/development/primary-db/password` which would then be resolved at runtime against a remote CredHub instance authenticated and authorized with mTLS and cryptographic container identity.


[i]: https://docs.cloudfoundry.org/devguide/deploy-apps/instance-identity.html
[f]: https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod
[p]: https://kubernetes.io/docs/concepts/configuration/secret/#protections


With the mounting of secrets as files as a baseline, the question then becomes how to communicate the additional metadata attached to a service.

## Metadata and Secret Directories
A service is exposed as a directory at `/platform/services/<service-name>`.  Within that directory is a `metadata` directory that contains extensible metadata about the service itself files for each key, containing the contents of the metadata.  Also within that directory is a `secret` directory that contains files for each key within the secret, containing the values of each of those keys.

### Structure
```plain
platform
└── services
    ├── primary-db
    │   ├── metadata
    │   │   ├── connection-count
    │   │   ├── kind
    │   │   ├── provider
    │   │   └── tags
    │   └── secret
    │       ├── endpoint
    │       ├── password
    │       └── username
    └── secondary-db
        ├── metadata
        │   ├── connection-count
        │   ├── kind
        │   ├── provider
        │   └── tags
        └── secret
            ├── endpoint
            ├── password
            └── username
```

In this scenario, `kind`, `profider`, and `tags` would be special and mandatory entries for service metadata.  List entries like the contents of `tags` would be newline delimited.  All other entries would be optional and arbitrary, specific to each service that is bound.  Note, that this RFC uses these special keys as examples and is not binding; the actual spec update will codify mandatory metadata entries.

# Drawbacks
[drawbacks]: #drawbacks

This is a disruptive change from the V2a/b ecosystem that exists today.  Existing buildpacks and frameworks that know how to read this information today (e.g. Spring Boot, Spring Cloud Connectors) will need extensive changes to consume the new design.  Not specifying this (specifically removing `CNB_SERVICES` completely) would allow each platform to continue with their existing service exposure and without breaking compatibility.  It would also prevent a large percentage of CNBs from being cross-platform.

However, given the security improvements that secrets on the filesystem provide, it is likely that all platforms will eventually move in this direction.  This is going to be disruptive no matter what, so a synchronized disruption towards a cross-platform solution seems to be valuable.  In addition, there appears to be a migration path where platforms expose the same information in their current way while simultaneously replicating that information using the CNB specified way.

# Alternatives
[alternatives]: #alternatives

Leading to this RFC, various options were considered and [even implemented][l].  The general consensus when consulting with Kubernetes and security experts is that environment variables, while easy and flexible, have fundamental issues that many organizations are unwilling to accept.  In addition de-specifying service binding was considered, but there's enough upside for cross-compatibility and a large enough percentage of buildpacks would make use of service bindings, that it was decided to create this proposal.  Not specifying service bindings, while leaving the placeholder `CNB_SERVICES` in place doesn't seem to be a real option, so if this main thrust of this proposal is not accepted `CNB_SERVICES` should be removed from the specification.

[l]: https://github.com/buildpacks/libbuildpack/tree/main/services

# Prior Art
[prior-art]: #prior-art

## Heroku
Heroku [exposes services using a series of environment variables][h] such as `DATABASE_URL` and `JDBC_DATABASE_URL`.  This requires buildpacks and applications to know about the exact naming of these environment variables and there's no structured data associated with them (although additional well-known environment variables could communicate it) so it's difficult to identify very specific services.  On the positive side it's trivial, in nearly every language, to extract the data from the environment variables and configure an application.

[h]: https://devcenter.heroku.com/articles/connecting-to-relational-databases-on-heroku-with-java

## Cloud Foundry Service Bindings
Cloud Foundry [exposes services from a well-known environment variable, `VCAP_SERVICES`][c].  Within that variable is a structured and arbitrarily large JSON payload that not only communicates the credentials for a service, but also metadata about that service.  This allows a generic processing of the payload that more advanced decisions can be based upon.  The downside of this is that in order to extract any credential information a pre-processing step must be completed.

[c]: https://docs.cloudfoundry.org/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES

## Cloud Foundry Instance Identity
Cloud Foundry [exposes a cryptographic instance identity][i] to each container.  This identity is represented as a X.509 certificate and private key written to well-known locations on the filesystem.  The certificate associated with this identity is rotated on a periodic basis (every 24 hours by default) and does not require an application process to be restarted in order to accomplish this rotation.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

It is expected that acceptance of a directory-based model and the general structure of that directory system will be resolved by this RFC.  It is expected that, if the metadata TOML file model is chosen, the contents of that file are defined as part of the specification and implementation of the feature.  Management of services, and the values of the exposed secrets is not within scope of this RFC and will continue to be defined by each implementing platform.
