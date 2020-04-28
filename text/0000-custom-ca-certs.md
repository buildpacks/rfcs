# Meta
[meta]: #meta
- Name: Custom CA Certs
- Start Date: 2020-03-30
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

In order to allow developers to use custom CA certs during build, this RFC:
1. Suggests an interface between stacks and the platform to allow adding ca-certs to builds and for creating and extending builders with CA certs
2. Suggest a `pack` UX for using certs during build and for creating and extending builders with CA certs

**Note**: This RFC builds on some of the ideas proposed in https://github.com/buildpacks/rfcs/pull/23 to begin producing a generic interface for extending build/run images.

# Motivation
[motivation]: #motivation

Use of custom CA certs is pervasive, especially for developers in enterprise environments. These developers need to fetch assets during build from corp artifact stores, publish to registries with custom certs, and make certs available during runtime for container images. Furthermore, developers might want to more granularly apply certificates, for example leaving certs out of a runtime container that were available during build. In order to account for the possible diversity of methods for adding CA certs in various stacks, the stack itself must embed this knowledge. But we should avoid the possibility of ad-hoc methods and stack forking, by coming up with a community solution.

This solution should further be extensible for other ways of extending builders, thus should have a relatively generic interface. This RFC proposes using that interface for adding CA certs, but leaves the details of other forms of extension up to subsequent RFCs.

# What it is
[what-it-is]: #what-it-is

### Specification
Stack authors may include an `extend` executable to the build and/or run images of their stack:
```
/cnb/image/{build,run}/extend ({build,run}-extend-toml-file) | cwd: /
```

For the purpose of CA certs, extend should examine the `certs = []` key of the file supplied (by the platform) in the first argument. The file should follow this schema:

```toml
# extend.toml
certs = [
    """-----BEGIN CERTIFICATE-----
AASDASDASDASD
ASDASDASDSADASD
ASDSADSADsda
etc
-----END CERTIFICATE-----""",
]
```

### UX

##### pack
Given the following command:
`pack build --cert /cert1.pem --cert:build /cert2.pem --cert:run /cert3.pem`

Certs will go:
`cert1.pem` will be added to both build* and run images
`cert2.pem` will be only available during application build* time
`cert3.pem` will be only available during application run time

*For the purposes of this RFC build includes publishing. In other words `pack` will be able to use build-time certs to talk to registries. Platform authors should implement adding these certs to whatever registry connection they make as part of implementing this RFC.

##### Creating a new CA cert extended builder

`pack create-builder cnbs/builder:ca-certs-extended -b builder.toml`

```toml
# builder.toml
[stack]
id = "io.buildpacks.stacks.bionic"
build-image = "example.com/build"
run-image = "example.com/run"
run-image-mirrors = ["example.org/run"]

[extend]
certs = ["./cert1.pem"] # Relative to location of `builder.toml`
[extend.run]
certs = ["./cert2.pem"] # Relative to location of `builder.toml`
[extend.build]
certs = ["./cert3.pem"] # Relative to location of `builder.toml`
```

*Behavior*: Creates a new builder with `cert1.pem` on both run and build images, `cert2.pem` on run image, and `cert3.pem` on build image.

##### Creating a new CA cert extended builder

`pack create-builder cnbs/builder:ca-certs-extended -b builder.toml`

```toml
# builder.toml
[builder]
image = "cnbs/builders:bionic" # Base new builder on this key

[extend]
certs = ["./cert1.pem"] # Relative to location of `builder.toml`
[extend.run]
certs = ["./cert2.pem"] # Relative to location of `builder.toml`
[extend.build]
certs = ["./cert3.pem"] # Relative to location of `builder.toml`
```

*Behavior*: Creates a new builder with `cert1.pem` on both run and build images, `cert2.pem` on run image, and `cert3.pem` on build image.

Note that the [builder] section is mutually exclusive with [stack].

##### Building an app with additional CA certs

`pack build cnbs/myapp`

```toml
# project.toml
[extend] # Both build
certs = ["./cert1.pem"] # Relative to location of `builder.toml`
[extend.run]
certs = ["./cert2.pem"] # Relative to location of `builder.toml`
[extend.build]
certs = ["./cert3.pem"] # Relative to location of `builder.toml`
```

# How it Works
[how-it-works]: #how-it-works

Platforms may extend app images with custom CA certs using the above interface by running the `extend` executable as root in a new container and creating an image from the result. Prior to this execution, the platform will be responsible for populating the contents of `[certs]` in `*-extend-toml`. Extending an image in this fashion should generate a single layer. This should happen prior to the normal CNB build or rebase process.

# Drawbacks
[drawbacks]: #drawbacks

- Some complications of UX.

# Alternatives
[alternatives]: #alternatives

- Rely on stack authors to do this themselves by just creating custom stacks.

# Prior Art
[prior-art]: #prior-art

This RFC builds on some of the ideas proposed in https://github.com/buildpacks/rfcs/pull/23

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Given that the utility of runtime cert extension is limited (platforms usually mount and rotate them) does it make sense to restrict discussion in this RFC to build-time extension. If so we can punt on how rebasing will work.
- Build vs Runtime CA-certs? Do we need to split them or should we just collapse this into one?
- Dynamically extended run image vs just adding to launch image (comes to the same thing?)
- How does the platform communicate to buildpacks that certs are available?

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Will likely entail changes to spec, but these will be hashed out during RFC discussion. Will document these here as they fall out in discussion.
