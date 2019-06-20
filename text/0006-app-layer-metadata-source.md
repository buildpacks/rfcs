# Meta
[meta]: #meta
- Name: Manifest - App metadata - add source uri, branch & ref
- Start Date: 2019-06-10
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

Adds `Config.Labels."io.buildpacks.app.metadata"` property to the manifest to hold app specific metadata.

This RFC further proposes to add a source uri, branch and ref properties to this new app metadata property, `Config.Labels."io.buildpacks.app.metadata".source.uri`, `Config.Labels."io.buildpacks.app.metadata".source.branch` & `Config.Labels."io.buildpacks.app.metadata".source.ref`.

# Motivation
[motivation]: #motivation

- **Why should we do this?**
The provenance of the app should be transparent, and the image should be
reproducible.  Providing metadata about the source uri, branch and ref of the App assists
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

This feature adds additional metadata to the image manifest.  It introduces
three new properties related to the App layer.  These properties are the uri, branch and ref
of the source.

It is proposed that these properties would be added as children of `Config.Labels."io.buildpacks.app.metadata"`.

We propose `source.uri`, `source.branch` and `source.ref` properties.

Example:
```
{
  Config: {
    Labels: {
      "io.buildpacks.app.metadata":"{\"source\":{\"uri\":\"https://github.com/buildpack/rfcs.git\", \"branch\":\"master\", \"ref\":\"a33a985597b04c36aeefd6b17c4ef593adb5dc01\"}}"
    }
  }
}
```

Unencoded, `io.buildpacks.app.metadata` is:
```
{
  "source": {
    "uri": "https://github.com/buildpack/rfcs.git",
    "branch": "master",
    "ref": "a33a985597b04c36aeefd6b17c4ef593adb5dc01"
  }
}
```

# How it Works
[how-it-works]: #how-it-works

The lifecycle may be provided additional metadata values, and this should be marshalled to the image manifest.
Platforms may or may not use these additional properties.

In terms of the lifecycle implementation, this is likely to require changes to the [exporter](https://github.com/buildpack/lifecycle/blob/af8b71578ed91303834ef57a7e3568ce3081f153/exporter.go#L50-L54) to add the additional app metadata.

# Drawbacks
[drawbacks]: #drawbacks

There may be a risk in the future that these suggested keys may not align with different potential future metadata schemas (e.g. to add additional keys).

# Alternatives
[alternatives]: #alternatives

1. We considered [OCI pre-defined annotation
keys](https://github.com/opencontainers/image-spec/blob/master/annotations.md#pre-defined-annotation-keys).
*  **Pro**:
    * Follows existing OCI specification
*  **Con**:
    * it is possible that the source for building the image is separate from the source for building the app layer.  This attribute would not allow both to be added, and would not allow differentiation between the two.
1. A buildpack could be created which would add the metadata.
    *  **Pro**:
        * Does not have to be part of the specification.
        * Extensible to additional buildpacks to provide different types of metadata (e.g. from other source control repositories)
    *  **Con**:
        * This would require the buildpack user to specify this additional buildpack.
        * This would put the metadata in the specific buildpack layer.

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
