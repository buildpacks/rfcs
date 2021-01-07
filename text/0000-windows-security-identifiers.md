# Meta
[meta]: #meta
- Name: Use Security Identifiers for Windows User/Group IDs
- Start Date: 2020-12-15
- Author(s): micahyoung
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
Windows stack authors should specify `CNB_OWNER_SID`/`CNB_GROUP_SID` (instead of `CNB_USER_ID`/`CNB_GROUP_ID`) where the values are Windows Security Descriptor strings (ex: "**S-1-5-93-2-1**", aka "ContainerAdministrator"). When reading/generating Windows images, all implementations and platforms should accept SIDs and write SID-based Security Descriptors to image layer entries and container files instead of POSIX UID/GIDs.

File and directory entries in Microsoft Windows NTFS file systems and Windows OCI layers use a Security Descriptor encoded into the file system/tar header (resp). The Security Descriptor is a data structure comprised of a pair of Security Identifier (SID) strings to specify a file's Owner and Group, along with additional data to describe detailed access permissions. This differs from POSIX file systems which use User Identifier/Group Identifier integer values encoded into the file system/tar header.

Up until now, CNB platforms and implementations needed to either ignore or convert POSIX UIDs/GIDs to Windows SIDs to create appropriately permissioned files in image layers. This RFC proposes changing implementations/platforms by changing the spec so all existing references to a POSIX *UID/GID* will become a Windows *Owner SID/Group SID* when generating Windows image metadata, environment variables, and file/directory entries in layers and volumes. 

# Definitions
[definitions]: #definitions
* *Security Identifier*: A unique value of variable length that is used to identify a Windows *Security Principal*. Expressed as a string. Maximum 256 bytes.
  * [Microsoft SID definition](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/78eb9013-1c3a-4970-ad1f-2b1dad588a25) 
  * [SID components](https://docs.microsoft.com/en-us/windows/win32/secauthz/sid-components)
  * [SID formal spec](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-identifiers)
  * [Well-known Windows SIDs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/81d92bba-d22b-4a8c-908a-554ab29148ab)
  * [Container-specific SIDs in moby/moby](https://github.com/moby/moby/blob/751d5f879a4f625bd32b08481bbb45e5d2db5b6c/pkg/system/syscall_windows.go)
* *Security Principal*: Any entity that can be authenticated by the Windows operating system, such as a user account, a computer account, or a thread or process that runs in the security context of a user or computer account, or the security groups for these accounts
* *Security Descriptor*: A data structure, binary-encoded into the header on an NTFS or Windows OCI layer tar archive. It contains the security attributes of a file entry including who owns the object; who can access the object and what they can do with it; what level of audit logging can be applied to the object; and what kind of restrictions apply to the use of the security descriptor. The relevant attributes here are `OwnerSid` (*Owner*), `GroupSid` (*Group*) - both SIDs.
  * [Microsoft Security Descriptor definition](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-descriptors)
  * [Security Descriptor formal spec](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/7d4dac05-9cef-4563-a058-f108abecce1d)
  * [Mirosoft reference implementation](https://github.com/microsoft/referencesource/blob/master/mscorlib/system/security/accesscontrol/securitydescriptor.cs)
* *PAX Records*: A extensions to the tar archive format, allowing additional data to be recorded in tar entries. 
  * [Golang `PAXRecords` documentation](https://golang.org/pkg/archive/tar/#:~:text=PAXRecords%20map)
  * Common PAX records for Windows:
    * `MSWINDOWS.rawsd`: base64-encoded *Security Descriptor*, which will be applied to the extracted OCI layer file
    * `MSWINDOWS.fileattr`: specifies file type (file, directory)
* `MSWINDOWS.rawsd`: base64-encoded self-relative binary security descriptor
  * [OCI Image Layer spec](https://github.com/opencontainers/image-spec/blob/master/layer.md#platform-specific-attributes)

# Motivation
[motivation]: #motivation

> Why should we do this?

We should do this because implementations and platforms currently indirectly infer Windows permissions from Linux permissions which leads to confusion and bugs. It's also simpler (and closer to the Linux implementation) to directly apply the intended SIDs to tar layer PAX Records and does not depend on the Windows OS to do so. Additionally, Windows SIDs are much more intuitive and expected for security-concious Windows users who are interested in choosing specific permissions.

> What use cases does it support?
 
This allows Windows to support all the same UID/GID ownership use-cases that Linux currently does, such as stack image, buildpackage, directory-based buildpack creation and usage.

> What is the expected outcome?

Windows stack authors should specify `CNB_OWNER_SID`/`CNB_GROUP_SID` and all user-owned files would have the SID value set as their *Owner SID/Group SID*. 

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

> Define any new terminology.

No new terminology - just conventional Windows and Docker security terms.

> Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.

Stack authors, platform operators, platform implemenators, and project contributors would all need to be aware of this change.

> Explaining the feature largely in terms of examples.
  
As a Windows user, so I can minimize the attack vector of files in my container filesystem, I need to set specific ownership of implementation/platform generated files, just as Linux users do, but using conventional  Windows security identifiers corresponding to container users. To set the ownership, I change the `CNB_OWNER_SID` and `CNB_GROUP_SID` to match my runtime container user.   

> If applicable, provide sample error messages, deprecation warnings, or migration guidance.

From the spec perspective, all migration needs would be covered by an API bump for implementations and change the values they use for `-uid` and `-gid` to SID strings (or add new flags).

In terms of `pack` and `lifecycle` specifically, most migration work will need to be done to change `imgutil`'s [group-based constants](https://github.com/buildpacks/imgutil/blob/main/layer/windows_writer.go#L56-L60) permissions and instead add helpers that can be used in implementations/platforms to convert SIDs strings and write into `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` records. This would slightly change all images (builders, buildpackages, apps) that use `imgutil`.

Even though some Windows functionality is technically "experimental", to migrate smoothly we should:
1. Add new static helper functions to `imgutil/layer` to convert SIDs to `MSWINDOWS.rawsd` strings that can be used for `tar.Header.PAXRecords["MSWINDOWS.rawsd"]`.
1. Change `pack` to create Windows builders/buildpackages using `imgutil/layer.WindowsWriter` to stop writing `tar.Header.Uid/Gid` in Windows images and instead write `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` using `imgutil`'s new static helper functions to convert SIDs. Root-owned files should always have the well-known SID for `BUILTIN\Administrators`. While deprecating, builders can use the well-known SID for `BUILTIN\Users` and warn when a user SID is not provided. 
1. Change `lifecycle` flags `-uid` and `-gid` to require SIDs on Windows (or add new flags), stop writing `tar.Header.Uid/Gid` for exported images, instead write `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` based on SIDs, and bump the API.
1. Change platforms that use the new lifecycle, to always call `lifecycle` with SID values.
1. Change samples and documentation along the way to demonstrate how to use the new values.

> If applicable, describe the differences between teaching this to existing users and new users.

Any Linux-specific documentation or existing Windows samples for Windows run images would need to change to reflect the new variables for Windows.

# How it Works
[how-it-works]: #how-it-works

Every platform/implementation-generated image layer entry that currently sets an explicit `tar.Header.Uid/Gid` set, will need to instead set a `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` entry reflecting the equivalent permissions.

When Docker (and other container runtimes) read and image layer file and create a container file, the permissions are based on the layer's tar entry headers. For Linux images, the `tar.Header.Uid/Gid` becomes the file's `Uid/Gid`. For Windows, `tar.Header.Uid/Gid` are ignored and instead `tar.Header.PAXRecords["MSWINDOWS.rawsd"]` becomes the file's Security Descriptor (when blank, a permissive default is used).

The value of `MSWINDOWS.rawsd` is a base64-encoded, binary Security Descriptor containing an owner SID and group SID. The Security Descriptor data structure is complex to generate and requires some background.

### Generating Security Descriptors
Windows Security Descriptor-based file permissions are much richer and more complex than POSIX UID/GIDs, still consisting an owner and group, but whose values can be SIDs of users/groups/other system objects. Separate from the owner/group SID entries, each Security Descriptor has optional Access Control Lists, for fine-grained access control or for auditing permissions, but which can be left blank for our purposes. 

Windows users typically manipulate Security Descriptors through GUIs or complex hierarchical permission systems like Active Directory. Due to this, the data structures to store SIDs themselves and APIs to manipulate them are more complex, as less user-friendly, and very Windows-specific. 

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
    ownerSID,                    // owner SID
    nil,                                // group SID
    nil,                                // system ACL
    nil,                                // discretionary ACL
  )
// ... 
```


The `StringToSid` function converts the string SID to a struct and `SetNamedSecurityInfo` changes the Owner field of the file's on-disk Security Descriptor. The `nil` fields - Group, DACL, SACL - are not set here but can be set in this API. 

Unfortunately even these functions can't be used, as both `windows.StringToSid` and `windows.SetNamedSecurityInfo` wrap underlying Windows-only API syscalls. Also, re-purposing them to write to tar.Header entries instead of a real filesystem would be complex.

Instead, a roughly-equivalent, cross-platform prototype is here: https://github.com/micahyoung/sid-to-rawsd/tree/25fe3b86eb42823171828dfd972d9cb9ee86f988

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

These prototype functions generate identical Security Descriptors as the syscalls but need to be tested and supported, likely as part of `imgutil/layer`.

# Drawbacks
[drawbacks]: #drawbacks

> Why should we *not* do this?

The downsides I anticipate are the complexity of implementing and the divergent user-facing behavior of `CNB_USER_ID` for Linux and `CNB_OWNER_SID` for Windows. 

# Alternatives
[alternatives]: #alternatives

> What other designs have been considered?

The current stop-gap implementation logic converts POSIX `UID`/`GID` to SIDs as: 
  * When `UID=0` && `GID=0`, then set SID to the group `BUILTIN\Administrators`, 
  * otherwise, set SIDs to the group `BUILTIN\Users`
This is quite limited as `BUILTIN\Users` would be any user in the container (and possibly the host).

An alternative design was to use a format like [*Security Descriptor Definition Language*](https://docs.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-definition-language) strings and a single env-var like `CNB_SECURITY_DESCRIPTOR=O:S-1-5-93-2-1G:S-1-5-93-2-1`. This would potentially have allowed more expressive SID permissions but there was no cross-platform tooling for translating SDDLs into the required security descriptor data structures. This would have required even more complex code to be written than the proposed design, and potentially cause more obscure errors when unanticipated SDDLs were applied by the container runtime.

A similar, though even more hands-off design could accept the entire `MSWINDOWS.rawsd` value: `CNB_RAW_SECURITY_DESCRIPTOR=AQAAgBQAA...`. A major downside would be that the value would need to be parsed and validated to prevent very hard-to-debug errors when the container runtime attempts to apply the Security Descriptor, potentially long after the image is authored. Additionally, these values would be unintuitive. One upside though is that a Windows-only helper tool could be written using Windows sycalls, or a cross-platform tool using [Microsoft's c# reference implementation](https://github.com/microsoft/referencesource/blob/master/mscorlib/system/security/accesscontrol/securitydescriptor.cs).

Another design attempts was to try to pack SID data into integers and still use `CNB_USER_ID`, `CNB_GROUP_ID`. Unfortunately the design was unworkable, as SIDs have a [variable-length](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/f992ad60-0fe4-4b87-9fed-beb478836861) that can easily exceed even 64bit integer. Additionally, the packed integer format would be very unintuitive.

A few other approached were considered in various issue discussions:
* https://github.com/buildpacks/spec/issues/129
* https://github.com/buildpacks/lifecycle/issues/343
* https://github.com/micahyoung/sid-to-rawsd

> Why is this proposal the best?

Using SIDs for owner/group on Windows, nicely parallels UID/GID for POSIX, allowing end-users and implementors to have an analogous understanding of both. The current UID-to-SID translation logic that currently exists is potentially surprising and insufficient for equivalent security settings on Windows. 

Most of the complexities of generating `MSWINDOWS.rawsd` values from SIDs have been hashed out in the prototype, and creating a supported implementation can lead to better community standardization beyond just buildpacks platforms/implementations.

Using SIDs (over SDDLs or rawsd values) is the best balance of allowing fine-grained security - analogous to POSIX - while limiting vectors for unintended permission changes.

> What is the impact of not doing this?

If we continue with the current UID-to-SID translation logic, Windows stacks will continue to be authored with implicit, overly permissive file ownership and generated Windows app images and containers will be less secure. Bugs/issues may be raised when Windows end-users expect analogous behavior to UID/GID and will want to extend the translation logic instead of expressing it directly as SIDs.

In terms of timing, there are currently few Windows stacks and waiting to introduce this type of breaking change will be more impactful and harder to mitigate in the future.

# Prior Art
[prior-art]: #prior-art

* [`Microsoft/go-winio/backuptar`](https://github.com/microsoft/go-winio/blob/master/backuptar/tar.go) Golang library for converting back and forth between actual NTFS files and tar archives. It is Windows-only but generates `MSWINDOWS.rawsd` fields (directly duplicating from disk) and is a potentially useful reference.
* [`moby/buildkit/winlayers`](https://github.com/moby/buildkit/blob/22156ab20bcaea1a1466d277dbf1f1386fa23bd9/util/winlayers/differ.go#L194-L204) contains a Windows differ which uses pre-generated `MSWINDOWS.rawsd` values, based on complex SDDLs which also includes ACL values.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

> What parts of the design do you expect to be resolved before this gets merged?

* Agreement on the stack env var names (i.e. `CNB_OWNER_SID`/`CNB_GROUP_SID`)
* Agreement on the implementation command-line flag conventions (i.e. `creator -uid <SID string>` vs `creator -owner-sid <SID string>`)
* Any broader spec changes, beyond just amending UID/GID references with Windows-specific SID equivalents

> What parts of the design do you expect to be resolved through implementation of the feature?
 
* How to validate SID format + handling unknown edge cases (SIDs that will cause obscure runtime failures and should be caught early)
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
* Changes to lifecycle flags: 
  * `-uid`/`-gid` would now either accept SID values, or 
  * have alternatives on Windows (i.e. `-owner-sid`/`-group-sid`) 
