# Meta
[meta]: #meta
- Name: Process Type Arguments
- Start Date: 2020-06-02
- Author(s): nebhale
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

The lifecycle should add a new backwards-compatible command execution strategy for specifying command line arguments appended to an existing process type.

# Motivation
[motivation]: #motivation

Currently the specification provides a way for buildpacks to declare a set of process types that applications can be started with.  The lifecycle has support for specifying the name of any one of these process types and executing it (`docker run -t my-image web`) as well as support for users passing a completely custom command to be executed (`docker run -it my-image /bin/bash`). There is a missing use case of utilizing one of the pre-defined process types, but adding arguments to the end of the command rather than replacing it.

This pattern is commonly used in what might be described as "task" context.  For example, a Spring Boot application utilitzing Spring Batch might always start `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher`.  However at runtime this needs to be executed as `java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher --active.profile=green --partitions=21-45`.  The user shouldn't have to interrogate the image metadata to find out what the command would have been an synthesize their command from it.  In addition, if they choose to do this, as the command change during the evolution of the contributing buildpack or application, they'd need to make sure their command was kept in sync as well.

Instead, at execution time, the lifecycle should allow a user to specify the commands to append to an existing process type.

# What it is
[what-it-is]: #what-it-is

See [Motivation](#motivation).

# How it Works
[how-it-works]: #how-it-works

The lifecycle currently has a three step command resolution flow:

1.  0 args: execute the default process type
1.  1 arg:  if `$1` matches a process type, execute that process type
1.  N args: execute `$1` as the command with `${@:2}` as the arguments appended to that command

This proposal is to augment that command resolution flow with a fourth step:

1.  0 args: execute the default process type
1.  N args, if `$1` matches a process type: execute that process type with `${@:2}` as the arguments appended to that process type
1.  N args, if `$1` does not match a process type and does not match something on the resolved path: execute the default process type with `${@}` as the arguments appended to that process type
1.  N args, if `$1` does not match a process type and does match something on the resolved `$PATH`: execute `$1` as the command with `${@:2}` as the arguments appended to that command

# Drawbacks
[drawbacks]: #drawbacks

This is an added level of complexity when reasoning about what command will be executed given a set of inputs to an execution.

# Alternatives
[alternatives]: #alternatives

Previously in Cloud Foundry which did not support a system like this, the solution that was chosen was to use an environment variable to represent arguments:

```
java -cp "${CLASSPATH}" ${JAVA_OPTS} org.springframework.boot.loader.JarLauncher "${ARGUMENTS}"
```

This led to lots of brittleness and confusion around the parsing of arguments as they passed through various parts the platform and was never widely adopted.  This proposal is vastly superior as it creates a direct connection between user input and the delimited arguments passed to the command that is eventually executed without the indirection and requirement of a shell to process them.

# Prior Art
[prior-art]: #prior-art

See [Alternatives](#alternatives).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

* Should there be a bailout mechanism (setting an env var, a special flag) to be explicit about the desired behavior?
* Should a different syntax be used for the same effect (e.g. `docker run -t my-image web -- --active.profile=green --partitions=21-45`)?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

There will be changes to the platform specification to match the result of this RFC.
