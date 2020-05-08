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

CA-Cert extension configuration should happen as part of the creation of a builder. 
For known, project reserved, stack IDs, a preamble binary will be maintained by the project with the following interface:

```
/cnb/image/extender $INPUT | cwd: /
```
`$INPUT` will be a cert bundle.

For known stacks, builder creation will attach a builder label which advertises volume mounts mounts to be used for cert extension.
The label will create an `extend` key within the `io.buildpacks.builder.metadata` label with the following form:

```
{
  "description": "",
  "extend": {
      "certs": {
          "bundleHash": "", <-- Hash formula below
          "volumePaths: [], <-- Stack specific hashes
      }
  }
}
```

`bundleHash` is calculated using the existing cert bundle of the builder in the following fashion:
- Locate root certificate file. (This will vary by distro but roughly it should be files located per https://golang.org/src/crypto/x509/root_linux.go)
- SHA256 sum of the binary contents of the bundle as presented by OS.

When extending a build with certificates, the `certHash` should be a SHA256 of the certificate bundles.

The `bundleHash` and the `certHash` are used to calculate the volume name of a certificate being added to a build:
`sha256(string<bundleHash>+string<certHash>)`

`volumePaths` should advertise to the platform where the stacks stores certificates (e.g., `/etc/ssl/certs/` and `/usr/local/share/ca-certificates/`) during the addition of certs so that volumes can be reused in subsequent build containers.

##### Using volume mounts
If the extension path label is attached to a stack, a preamble phase will be executed whereby the platform will builders extend binary with the certificate bundle, mounting volumes for each path item in the supplied label. 

Subsequent phases of the lifecycle will be executed with these same volumes attached, thereby recycling their contents for the duration of the build.

Platforms may optionally attach these volumes during execution of resulting app image (runtime).

### UX

##### pack
Given the following command:
`pack build --cert /cert1.crt MY-IMAGE`

Certs will go:
`cert1.crt` will be added to all build containers.

*For the purposes of this RFC build includes publishing. In other words `pack` will be able to use build-time certs to talk to registries. Platform authors should implement adding these certs to whatever registry connection they make as part of implementing this RFC.

##### Creating an extensible builder with a project reserved ID

`pack create-builder cnbs/builder:ca-certs-extended -b builder.toml`

```toml
# builder.toml
[stack]
id = "io.buildpacks.stacks.bionic"
build-image = "example.com/build"
run-image = "example.com/run"
run-image-mirrors = ["example.org/run"]
```

*Behavior*: Creates a new builder with project default extender binary and paths for `"io.buildpacks.stacks.bionic"` stack.

##### Creating a new CA cert extended builder

`pack create-builder cnbs/builder:ca-certs-extended -b builder.toml`

```toml
# builder.toml
[stack]
id = "org.someorg.stacks.coolest"
build-image = "example.com/build"
run-image = "example.com/run"
run-image-mirrors = ["example.org/run"]

[extend]
    [extend.certs]
    binary = "operator-extender-binary"
    volume-paths = ["/etc/ssl"]
```

*Behavior*: Creates a new builder that includes the project provided extender binary with `volumePaths=="[\"/etc/ssl\"]"` label.

# How it Works
[how-it-works]: #how-it-works

Platforms may extend app images with custom CA certs using the above interface by running the `extend` executable as root at the beginning of lifecycle phases. 

If volumes are to be used, it will attach volumes corresponding to those supplied in the volume label and mount these volumes in subsequent phases.

# Drawbacks
[drawbacks]: #drawbacks

- Some complications of UX.
- Creating an extended image via layers is slow.
- Not all stacks support ca-cert extension via filepaths.

# Alternatives
[alternatives]: #alternatives

- Rely on stack authors to do this themselves by just creating custom stacks.

# Prior Art
[prior-art]: #prior-art

This RFC builds on some of the ideas proposed in https://github.com/buildpacks/rfcs/pull/23

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Given that the utility of runtime cert extension is limited (platforms usually mount and rotate them) does it make sense to restrict discussion in this RFC to build-time extension? If so we can punt on how rebasing will work.
- Dynamically extended run image vs just adding to launch image (comes to the same thing?)
- How does the platform communicate to buildpacks that certs are available?
- Will paths work on windows?
- What sort of caching mechanism should be in place for recycling extended volumes?
- Baking certs into images

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

Will likely entail changes to spec, but these will be hashed out during RFC discussion. Will document these here as they fall out in discussion.
