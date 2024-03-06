# Meta
[meta]: #meta
- Name: Pack Logging Interface
- Start Date: 2019-05-06
- Status: Implemented
- CNB Pull Request: [rfcs#6](https://github.com/buildpacks/rfcs/pull/6), [pack#182](https://github.com/buildpacks/pack/pull/182)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This is a proposal to add a generic logging interface in pack that can be used by consumers to inject custom loggers. In addition we propose a new implementation of the pack logger that uses a third-party library.

# Motivation
[motivation]: #motivation

Pack uses its own internal logging code, and does not leverage any of the existing libraries in the Go ecosystem.  Not only does this mean that the pack libraries are tightly coupled to the pack cli, but it also means that developers who might want to use some of the public functionality provided by pack libraries in their own implementations can't customize logging to suit their own purposes. Also of course, it's more code that has to be maintained that is not closely aligned with the overall purpose of pack.

# What it is
[what-it-is]: #what-it-is

- A new `Logger` interface
- Replace the custom logging code in `pack` with a library

# How it Works
[how-it-works]: #how-it-works

Remove the custom logging code for pack.  All pack functions that take a pointer to the concrete `logging.Logger`  structure will be modified to take a simple logging interface as an argument.  Given the proliferation of logging packages in the Go ecosystem it may be impossible to design an interface that works with all of them. However by supplying a very simple interface the current logging requirement of pack can be met, and most logging libraries could be adapted to work with pack with little or no modification.

```
type Logger interface {
  // Debug replaces Verbose
  Debug(string)
  Debugf(fmt string, args ...interface{})
  Info(string)
  Infof(fmt string, args ...interface{})
  Error(string)
  Errorf(fmt string, args ...interface{})
}
```

The pack cli uses the custom logging code but this could be replaced by [apex/log](https://github.com/apex/log) or perhaps [logrus](https://github.com/sirupsen/logrus).

# Drawbacks
[drawbacks]: #drawbacks

- Adds a third-party dependency to pack

# Alternatives
[alternatives]: #alternatives

- Expose the interface, but keep the custom logging code as the default

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What logging provider should pack use by default?
