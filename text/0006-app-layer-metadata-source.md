# Meta
[meta]: #meta
- Name: Manifest - App metadata - add source url & hash
- Start Date: 2019-06-10
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Adds Source URL and hash properties to app metadata in the manifest, `Config.Labels."io.buildpacks.lifecycle.metadata".app`.

# Motivation
[motivation]: #motivation

- **Why should we do this?**
The provenance of the app should be transparent, and the image should be
reproducible.  Providing metadata about the source URL and commit hash of the App assists
in achieving this.

- **What use cases does it support?**
### Case 1
This supports providing buildpack users, including users with quality assurance, legal or security roles, with data about the origin of packaged material.  This helps in their understanding of the provenance of the app.

### Case 2
This supports providing a buildpack user with information that would allow them to attempt to reproduce the build/packaging.  This may be done as part of a verification step related to the above use case.

- **What is the expected outcome?**

Additional metadata would be provided to allow for verification of the source and reproduction of the build.

# What it is
[what-it-is]: #what-it-is

This feature adds additional metadata to the image manifest.  It introduces two
new properties related to the App layer.  These properties are the URL and hash
of the source.

It is proposed that these properties would be added as children of `Config.Labels."io.buildpacks.lifecycle.metadata".app`.

We propose `source.url` and `source.hash` properties.

Example:
```
{
  Config: {
    Labels: {
      "io.buildpacks.lifecycle.metadata":"{\"app\":{\"source\":{\"url\":\"https://github.com/buildpack/rfcs.git\", \"hash\":\"a33a985597b04c36aeefd6b17c4ef593adb5dc01\"}}}"
    }
  }
}
```

Unencoded, `io.buildpacks.lifecycle.metadata` is:
```
{
  "app": {
    "source": {
      "url": "https://github.com/buildpack/rfcs.git",
      "hash": "a33a985597b04c36aeefd6b17c4ef593adb5dc01"
    }
  }
}
```

# How it Works
[how-it-works]: #how-it-works

The lifecycle may be provided additional metadata values, and this should be marshalled to the image manifest.
Platforms may or may not use these additional properties.

In terms of the lifecycle implementation, this is likely to require an additional property to [Lifecycle Builder](https://github.com/buildpack/lifecycle/blob/af8b71578ed91303834ef57a7e3568ce3081f153/cmd/builder/main.go#L66-L75), the [Builder struct](https://github.com/buildpack/lifecycle/blob/af8b71578ed91303834ef57a7e3568ce3081f153/cmd/builder/main.go#L66-L75), plus the [AppMetadata struct](https://github.com/buildpack/lifecycle/blob/af8b71578ed91303834ef57a7e3568ce3081f153/metadata/metadata.go#L21-L23) and changes to the [exporter](https://github.com/buildpack/lifecycle/blob/af8b71578ed91303834ef57a7e3568ce3081f153/exporter.go#L50-L54).

# Drawbacks
[drawbacks]: #drawbacks

There may be a risk in the future that these suggested keys may not align with different potential future metadata schemas (e.g. to add additional keys).

# Alternatives
[alternatives]: #alternatives

We considered [OCI pre-defined annotation
keys](https://github.com/opencontainers/image-spec/blob/master/annotations.md#pre-defined-annotation-keys).
These are semantically applied at the image level.  However, it is possible that the source
for building the image is separate from the source for building the app layer.
Therefore we need metadata to describe the app separately.

# Prior Art
[prior-art]: #prior-art

None known.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- **What parts of the design do you expect to be resolved before this gets merged?**

The property names and schema should be agreed.

- **What parts of the design do you expect to be resolved through implementation of the feature?**

The entry point of this data into the lifecycle.  We expect the data to be
provided by the platform, and for the lifecycle to write it verbatim into the
manifest without need to alter or otherwise manipulate the provided data.

- **What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?**

Adding further/arbitrary metadata related to the app.
