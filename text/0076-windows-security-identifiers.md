# Meta
[meta]: #meta
- Name: Use Security Identifiers for Windows User/Group IDs
- Start Date: 2021-01-25
- Author(s): micahyoung
- Status: Approved
- RFC Pull Request: [rfcs#133](https://github.com/buildpacks/rfcs/pull/133)
- CNB Pull Request: (leave blank)
- CNB Issue: [buildpacks/spec#129](https://github.com/buildpacks/spec/issues/129), [buildpacks/lifecycle#343](https://github.com/buildpacks/lifecycle/issues/343), [buildpacks/pack#1079](https://github.com/buildpacks/pack/issues/1079), [buildpacks/docs#303](https://github.com/buildpacks/docs/issues/303)
- Supersedes: N/A

# Summary
[summary]: #summary
The spec states behavior that is currently unimplemented in `pack`/`lifecycle` and should be changed before it is implemented (example: [platform.md - **Build image**](https://github.com/buildpacks/spec/blob/313078611d8a7925cb69a241df58e7d749d7f364/platform.md#:~:text=CNB_USER_ID%20set%20to%20the%20user), related: [spec issue](https://github.com/buildpacks/spec/issues/129)):
> The image config's Env field has the environment variable CNB_USER_ID set to the user †UID/‡SID of the user specified in the User field.

Instead, Windows stack authors should specify *alternative* env vars for Windows `CNB_USER_SID`/`CNB_GROUP_SID` (instead of `CNB_USER_ID`/`CNB_GROUP_ID`) where the values are Windows Security Descriptor strings (ex: `CNB_USER_SID=S-1-5-93-2-1`). Elsewhere, in the platform spec (example: [creator](https://github.com/buildpacks/spec/blob/313078611d8a7925cb69a241df58e7d749d7f364/platform.md#creator)), lifecycle binaries are called with `-uid <uid>` and `-gid <gid>` flags. Instead, new flags should be used instead for Windows images: `-usid <SID>` or `-gsid <SID>` to accept SIDs. Finally, all platforms/implementations should use this SID values to generate Windows image layer entries and container files with Security Descriptors instead of leaving them blank or converting from POSIX UID/GIDs.

For context, file and directory entries in Microsoft Windows NTFS file systems use a Security Descriptor encoded into the file system to store owner/group data. Windows OCI layers also encode a Security Descriptor in the tar header to store owner/group data for container files. The Security Descriptor is a data structure comprised of a pair of Security Identifier (SID) strings to specify a file's Owner and Group (along with optional Access Control Lists for detailed access permissions). This differs from POSIX file systems which use User Identifier/Group Identifier integer values encoded into the file system/OCI layer tar header.

Up until now, CNB platforms and implementations either ignore or implicitly convert POSIX UIDs/GIDs to Windows SIDs to create appropriately permissioned files in image layers. This RFC proposes changing the implementations/platforms (via the spec) so all existing references to a POSIX *UID/GID* will become a Windows *Owner SID/Group SID* for Windows images, environment variables, and file/directory entries in layers and volumes.

There are various technical details involved with this design change, detailed below.  

# Definitions
[definitions]: #definitions
* *Security Principal*: Any entity that can be authenticated by the Windows operating system, such as a user account, a computer account, or a thread or process that runs in the security context of a user or computer account, or the security groups for these accounts
* *Security Identifier*: A unique value of variable length that is used to identify a Windows *Security Principal*. Expressed as a string. Maximum 256 bytes.
  * [Microsoft SID definition](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/78eb9013-1c3a-4970-ad1f-2b1dad588a25) 
  * [SID components](https://docs.microsoft.com/en-us/windows/win32/secauthz/sid-components)
  * [SID formal spec](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-identifiers)
  * [Well-known Windows SIDs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/81d92bba-d22b-4a8c-908a-554ab29148ab)
  * [Container-specific SIDs in moby/moby](https://github.com/moby/moby/blob/751d5f879a4f625bd32b08481bbb45e5d2db5b6c/pkg/system/syscall_windows.go)
* *Security Descriptor*: A data structure, binary-encoded into the header on an NTFS or Windows OCI layer tar archive. It contains the security attributes of a file entry including who owns the object; who can access the object and what they can do with it; what level of audit logging can be applied to the object; and what kind of restrictions apply to the use of the security descriptor. The relevant attributes here are `OwnerSid` (*Owner*), `GroupSid` (*Group*) - both SIDs.
  * [Microsoft Security Descriptor definition](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-descriptors)
  * [Security Descriptor formal spec](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/7d4dac05-9cef-4563-a058-f108abecce1d)
  * [Mirosoft reference implementation](https://github.com/microsoft/referencesource/blob/master/mscorlib/system/security/accesscontrol/securitydescriptor.cs)
* *PAX Records*: Extensions to the tar archive format, allowing additional data to be recorded in tar entries. 
  * [Golang `PAXRecords` documentation](https://golang.org/pkg/archive/tar/#:~:text=PAXRecords%20map)
  * Common PAX records for Windows:
    * `MSWINDOWS.rawsd`: base64-encoded *Security Descriptor*, which will be applied to the extracted OCI layer file
    * `MSWINDOWS.fileattr`: specifies file type (file, directory)
* `MSWINDOWS.rawsd`: base64-encoded self-relative binary security descriptor
  * [OCI Image Layer spec](https://github.com/opencontainers/image-spec/blob/master/layer.md#platform-specific-attributes)

# Motivation
[motivation]: #motivation

> Why should we do this?

We should do this because SID support in the spec is unimplemented and can be improved before we do so. 

Also, current platforms/implementations only accept POSIX UID/GID but already convert them into roughly-similar SID to create Windows images. This implicit conversion will inevitably lead to confusion and bugs. Directly using SIDs for Windows images is simpler (and closer to the Linux implementation). Additionally, Windows SIDs are much more intuitive for security-concious Windows users.

> What use cases does it support?
 
This allows platforms/implementations to create Windows images on any OS runtime environment and supports all the same UID/GID ownership use-cases that Linux currently does.

> What is the expected outcome?

From a user perspective, Windows stack authors will specify `CNB_USER_SID`/`CNB_GROUP_SID` in stack images and all generated user-owned files in builder, buildpackage, and app images would have the SID value set as their *Owner SID/Group SID*. When the env vars SIDs are not present or invalid for Windows images, platforms/implementations should generate helpful errors.

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

> Define any new terminology.

No new terminology - just existing Windows and Docker security terms.

> Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.

Since this involves changing user-facing variables (in stack images) and tightens security in generated images, then stack authors, platform operators, platform implementors, and project contributors would be potentially impacted and would need to be aware of this change.

> Explaining the feature largely in terms of examples.
  
As a Windows stack author, so I can control the permissions implementation/platform generated files to minimize the attack vector within my containers, I set the env vars `CNB_USER_SID`/`CNB_GROUP_SID` and `USER` to the desired container runtime SID/user. In practice, most stack authors will use Docker's builtin `ContainerUser` (SID: `S-1-5-93-2-1`).

As any other end-user, I use the stack images as usual.

> If applicable, provide sample error messages, deprecation warnings, or migration guidance.

All migration needs should be covered by an API bump and for implementations, adding new flags for `-usid` and `-gsid` (and rejecting their POSIX equivalents) when running on Windows. Platforms that accept older API versions will need to continue to convert `CNB_USER_ID` into equivalent Security descriptors. See detailed migration steps below ([High-level migration steps](#high-level-migration-steps))

> If applicable, describe the differences between teaching this to existing users and new users.

SID usage will be very similar to Linux, though almost always using the SID for the standard Docker Windows user `ContainerUser`. Any Linux-specific documentation or existing Windows samples for Windows run images would need to change to reflect the new variables for Windows.

# How it Works
[how-it-works]: #how-it-works

Every platform/implementation-generated image layer entry that currently sets an explicit `tar.Header.Uid/Gid`, will need to instead set a `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` entry based on the SID-user's permissions.

When Docker (and other container runtimes) read an image layer file and create a corresponding container file, the permissions are based on the layer's tar entry headers. For Linux images, the `tar.Header.Uid/Gid` becomes the file's `Uid/Gid`. For Windows, `tar.Header.Uid/Gid` are ignored and instead `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` becomes the file's Security Descriptor (when blank, a permissive default is used).

The value of `MSWINDOWS.rawsd` is a base64-encoded, binary Security Descriptor containing an owner SID and group SID. The Security Descriptor data structure is complex to generate and requires some background.

### Generating Security Descriptors
Windows Security Descriptor-based file permissions are much richer and more complex than POSIX UID/GIDs, still consisting an owner and group, but whose values can be SIDs of users/groups/other Security Principals (plus optional Access Control Lists, for fine-grained access control, but which can be left blank for our purposes). 

Windows users typically manipulate Security Descriptors through GUIs or complex hierarchical permission systems like Active Directory. Due to this, the data structures to store SIDs themselves and APIs to manipulate them are more complex, less user-friendly, and unique to Windows. 

For example, the Golang Windows-equivalent of `os.Chown`(which [has no Windows implemention](https://golang.org/pkg/os/#Chown)) looks like this:
  
```go
// convert SID string to struct
ownerSID, err := windows.StringToSid("S-1-5-93-2-1")
// ... 

// write a owner/group SIDs to the file's security descriptor
err = windows.SetNamedSecurityInfo(
    filePath,                           // path to file on filesystem
    windows.SE_FILE_OBJECT,             // type of object (file)
    windows.OWNER_SECURITY_INFORMATION, // fields of the security descriptor to write (owner only)
    ownerSID,                           // owner SID
    nil,                                // group SID
    nil,                                // system ACL
    nil,                                // discretionary ACL
  )
// ... 
```


The `StringToSid` function converts the string SID to a struct and `SetNamedSecurityInfo` changes the Owner field of the file's on-disk Security Descriptor. The `nil` fields - Group, DACL, SACL - are not set here but can be set in this API. 

Unfortunately these functions can't be used in any cross-platform way, as both `windows.StringToSid` and `windows.SetNamedSecurityInfo` wrap underlying Windows-only API syscalls. Currently, `pack` can create Windows buildpackage/builder images from any OS/Arch - Linux/Darwin/Windows - but relying on these syscalls would regress this functionality to just Windows/amd64.

Instead, a roughly-equivalent, cross-platform working prototype is here: https://github.com/micahyoung/sid-to-rawsd/tree/25fe3b86eb42823171828dfd972d9cb9ee86f988

Using the functions of this prototype we could construct the entire `MSWINDOWS.rawsd` value:
```go
ownerSID, err := accesscontrol.StringToSid("S-1-5-93-2-1")
// ...

groupSID, err := accesscontrol.StringToSid("S-1-5-93-2-1")
// ...

securityDescriptor := accesscontrol.NewSecurityDescriptor()

securityDescriptor.SetOwner(ownerSID)
securityDescriptor.SetGroup(groupSID)

rawSDBytes, err := securityDescriptor.Bytes()
// ...

rawSDBase64 := base64.StdEncoding.EncodeToString(rawSDBytes)
	
tarHeader.PAXRecords["MSWINDOWS.rawsd"] = rawSDBase64
// ...
```

These prototype functions generate identical Security Descriptors as the syscalls but need further testing and long term support, likely as part of `imgutil`.

But once these functions are incorporated and used everywhere that currently sets `tar.Header.Uid/Gid`, the Windows images they generate will have the correct permissions.

### High-level migration steps
In terms of `pack` and `lifecycle` specifically, most migration work will need to be done to change `imgutil`'s [group-based constants](https://github.com/buildpacks/imgutil/blob/main/layer/windows_writer.go#L56-L60) permissions and instead add helpers that can be used in implementations/platforms to convert SIDs strings and write into `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` records. This would slightly change all images (builders, buildpackages, apps) that use `imgutil`.

Even though some Windows functionality is technically "experimental", to migrate smoothly we should:
1. Add new static helper functions to `imgutil/layer` or `imgutil/archive` to convert SIDs to `MSWINDOWS.rawsd` strings that can be used for `tar.Header.PAXRecords["MSWINDOWS.rawsd"]`.
1. Change `pack` to stop writing `tar.Header.Uid/Gid` in Windows images and instead write `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` using `imgutil`'s new static helper functions to convert SIDs. Root-owned files should always have the well-known SID for `BUILTIN\Administrators` (`S-1-5-32-544`). While deprecating, `pack` can convert `CNB_USER_ID=1` to the well-known SID for `BUILTIN\Users` (`S-1-5-32-545`) and warn when `CNB_USER_SID` is not provided.
1. Add `lifecycle` flags `-usid` and `-gsid` only for Windows, stop writing `tar.Header.Uid/Gid` for exported images, instead write `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` based on SIDs, and bump the API.
1. Change platforms that use the new lifecycle, to always call `lifecycle` with SID values.
1. Change samples and documentation along the way to demonstrate how to use the new values.

# Drawbacks
[drawbacks]: #drawbacks

> Why should we *not* do this?

The downsides I anticipate are the complexity of implementing and the divergent user-facing behavior of `CNB_USER_ID` for Linux and `CNB_USER_SID` for Windows.

# Alternatives
[alternatives]: #alternatives

> What other designs have been considered?

The current stop-gap implementation logic ([imgutil source](https://github.com/buildpacks/imgutil/blob/main/layer/windows_writer.go#L56-L60)) converts POSIX `UID`/`GID` to SIDs as: 
  * When `UID=0` && `GID=0`, then set SID to the group `BUILTIN\Administrators`, 
  * otherwise, set SIDs to the group `BUILTIN\Users`
This is quite limited as `BUILTIN\Users` would be any user in the container (and possibly the host).

An alternative design ([discussion](https://github.com/buildpacks/spec/issues/129)) was to use a single env-var format like `CNB_SECURITY_DESCRIPTOR=O:S-1-5-93-2-1G:S-1-5-93-2-1` where the value syntax is the commonly-used [*Security Descriptor Definition Language*](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-definition-language) string. This would potentially have allowed more expressive SID permissions but there was no cross-platform tooling for translating SDDLs into the required security descriptor data structures. This would have required even more complex code to be written than the proposed design, and potentially allow more edge-cases from unanticipated SDDL permutations.

A similar, though even more hands-off design could accept the entire `MSWINDOWS.rawsd` value: `CNB_RAW_SECURITY_DESCRIPTOR=AQAAgBQAA...`. A major downside would be that the value would allow ever more edge-cases and would need to be parsed and validated to prevent very hard-to-debug errors which would only manifest after the image is authored. Additionally, these `rawsd` values would be unintuitive.

Another design attempts was to try to pack SID data into integers and still use `CNB_USER_ID`, `CNB_GROUP_ID`. Unfortunately the design only worked for very basic SIDs, as SIDs have a [variable-length](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/f992ad60-0fe4-4b87-9fed-beb478836861) that can easily exceed even 64bit integer. Additionally, the packed integer format would be very unintuitive.

> Why is this proposal the best?

Using SIDs for owner/group on Windows, nicely parallels UID/GID for POSIX, allowing end-users and implementors to have an analogous understanding of both. The current UID-to-SID translation logic that currently exists is potentially surprising and insufficient for equivalent security settings on Windows. 

Most of the complexities of generating `MSWINDOWS.rawsd` values from SIDs have been hashed out in the prototype, and creating a supported implementation for generating these values can lead to better community standardization beyond just buildpacks platforms/implementations.

Using SIDs (over SDDLs or rawsd values) is the best balance of allowing fine-grained security - analogous to POSIX - while limiting vectors for unintended permission changes.

> What is the impact of not doing this?

If we continue with the current UID-to-SID translation logic, Windows stacks will continue to be authored with implicit, overly permissive file ownership and generated Windows app images and containers will be less secure. Bugs/issues may be raised when Windows end-users expect analogous behavior to UID/GID and will want to extend the translation logic instead of expressing it directly as SIDs. 

In terms of timing, there are currently few Windows stacks and waiting to introduce this type of breaking change will be more disruptive and harder to mitigate in the future.

# Prior Art
[prior-art]: #prior-art

* [`Microsoft/go-winio/backuptar`](https://github.com/microsoft/go-winio/blob/master/backuptar/tar.go) Golang library for converting back and forth between actual NTFS files and tar archives. It is Windows-only but generates `MSWINDOWS.rawsd` fields (directly duplicating from disk) and is a potentially useful reference.
* [`moby/buildkit/winlayers`](https://github.com/moby/buildkit/blob/22156ab20bcaea1a1466d277dbf1f1386fa23bd9/util/winlayers/differ.go#L194-L204) contains a Windows differ which uses pre-generated `MSWINDOWS.rawsd` values, based on complex SDDLs which also includes ACL values.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

> What parts of the design do you expect to be resolved before this gets merged?

* Agreement on the stack env var names (i.e. `CNB_USER_SID`/`CNB_GROUP_SID`)
* Agreement on the implementation command-line flag conventions (i.e. `creator -usid <SID string> ...` for Windows/`creator -uid <GID integer>...` for Linux)
* Any broader spec changes, beyond just amending UID/GID references with Windows-specific SID equivalents

> What parts of the design do you expect to be resolved through implementation of the feature?
 
* How to validate SID format + handling unknown edge cases (SIDs that will cause obscure runtime failures should be caught early)
* How to merge existing file Security Descriptors (for app source files and directory-based buildpack files) with platform/implementation SID-based Security Descriptors

> What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

* Security Descriptors potentially allow for System ACLs and Discretionary ACLs which are optional but could be useful. We should consider these out of scope for this feature as they are not analogous to POSIX GID/UID and perhaps better considered if SELinux/NFS permissions are introduced.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes
> Does this RFC entail any proposed changes to the core specifications or extensions? If so, please document changes here.
>
> Examples of a spec. change might be new lifecycle flags, new `buildpack.toml` fields, new fields in the buildpackage label, etc.
>
> This section is not intended to be binding, but as discussion of an RFC unfolds, if spec changes are necessary, they should be documented here.

### General changes
* Amend all references to POSIX UID/GID to use SID for Windows images
* Add new flags on Windows (i.e. `-usid`/`-gsid`)

### Specific spec examples
Some areas of the platform spec that should change:

Under [**Build Image**](https://github.com/buildpacks/spec/blob/313078611d8a7925cb69a241df58e7d749d7f364/platform.md#:~:text=CNB_USER_ID%20set%20to%20the%20user)
> The image config's Env field has the environment variable CNB_USER_ID set to the user †UID/‡SID of the user specified in the User field.
>
> The image config's Env field has the environment variable CNB_GROUP_ID set to the primary group †GID/‡SID of the user specified in the User field.
>

And the lifecycle commands that use `-uid` (example:
[creator](https://github.com/buildpacks/spec/blob/313078611d8a7925cb69a241df58e7d749d7f364/platform.md#creator
))
