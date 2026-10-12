# Meta
[meta]: #meta
- Name: Pack phase debug script
- Start Date: 2025-04-04
- Author(s): BarDweller
- Status: Draft 
- RFC Pull Request:
- CNB Pull Request: 
- CNB Issue:
- Supersedes: N/A

# Summary
[summary]: #summary

An ability to dynamically add and invoke a debug script instead of the lifecycle binary per phase during `pack build`.

# Motivation
[motivation]: #motivation

- Why should we do this?
    - Debugging state within a builder can be tricky, it can be beneficial during buildpack and platform development to understand the content of buildpack toml files, and filesystem permissions, and even know sha hashes for builder packaged content. While it is possible to test some things via a custom debug buildpack, buildpacks are not involved in every phase of execution, and some changes occur outside of their involvement. Being able to trace those state changes and verify assumptions is beneficial to buildpack and platform developers alike. 
- What use cases does it support?
    - Example scenarios: 
      - Trying to validate filesystem ownership/permissions/layout within a build container
      - Validating cnb toml content pre-post phase execution to ensure changes are as expected
      - Dumping checksum hashes of builder content to validate binaries being tested are the right ones

# How it Works
[how-it-works]: #how-it-works

The pack cli would allow specification of a debug script, that should be driven instead of the appropriate lifecycle binary for each phase. 

The script will be passed the name/path and arguments of the lifecycle binary that would have been driven. 

The script is able to run abitrary commands and dump information to stdout/stderr, these commands can include invoking the original lifecycle binary with its original arguments. 

A simple debug script could look like.. 

```bash
      #!/bin/bash
      echo "Layer dir Content Before"
      ls -lar /layers      
      LIFECYCLE=$1
      shift
      $LIFECYCLE "$@"
      echo "Layer dir Content After"
      ls -lar /layers  
```

This dumps the content of the /layers dir, invokes the orignal command and then dumps it again.. 

From a technical perspective, the debug script will be added to the ephemeral builder image at /cnb/lifecycle/debug, and used as the command when invoking the phase container. 

# Migration
[migration]: #migration

This is a new feature, no migration issues are anticipated.

# Drawbacks
[drawbacks]: #drawbacks

- Adds clutter to an already complex set of commandline options for pack

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
  - custom debug buildpacks .. don't allow visibilty over changes by non-buildpack phases. 
  - custom injected lifecycle binaries with extra debug added .. a pain to build/rebuild each time you need to verify soemthing else
  - live snooping into the container .. difficult to ensure what you are viewing as the build is executing concurrently
- Why is this proposal the best?
  - it's the simplest way to allow developers to gain visibility into the build process
- What is the impact of not doing this?
  - harder to understand builds, harder to debug permission issues... etc

# Prior Art
[prior-art]: #prior-art

Suggesting here, as I implemented this in the snowdrop platform implementation https://github.com/snowdrop/java-buildpack-client 
It was very useful there in debugging multi-arch sha reference issues with platforms 0.10 and 0.11

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
  - do we want to only support scripts? how about any executable (as per buildpack detect/build)
  - do we want to support pre-packaged debug scripts within a builder?  
  - should configuration of the script be via command line options for pack, or env vars ?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

This is purely an optional build time enhancement to a platform impl, it does not need a spec change.

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