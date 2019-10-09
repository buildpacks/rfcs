# Meta
[meta]: #meta
- Name: Allow GitHub specific url parsing for remote buildpacks
- Start Date: 2019-10-09
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Allow pack users to specify shorter GitHub urls when specifying remote buildpacks explicitly. These urls would contain the repo and potentially a tag name of the release to download.

# Motivation
[motivation]: #motivation

Today, users have to go to a buildpack's repository on GitHub, find the latest release, and then grab the published tar asset url to give to the pack cli. The tar names are user specified meaning they are not consistent between buildpacks or even releases.

Example command today referencing a GitHub release asset:

```
pack build myimage --buildpack https://github.com/company/my-buildpack/releases/download/v1.0.0/my-buildpack-v1.0.0.tgz
```

# What it is
[what-it-is]: #what-it-is

Terminology:

* **tag name** The GitHub tag name to find a release by. Specified after the `@` in the url.
* **assets** The assets associated with a [GitHub release](https://developer.github.com/v3/repos/releases/#upload-a-release-asset).

Allow users to specify a new `--buildpack` remote url format specific to GitHub. Using the GitHub API to expand this url to a release's specific tar upload.

# How it Works
[how-it-works]: #how-it-works

Example valid commands:

```
pack build myimage --buildpack https://github.com/company/my-buildpack@v1.0.0
pack build myimage --buildpack https://github.com/company/my-buildpack
```

The proposal would have pack use with the [GitHub Releases API](https://developer.github.com/v3/repos/releases/) when a url matches the above example patterns. A GitHub release would be found using the tag name specified in the url. If no tag is specified, the latest release is used.

If no matching release is found, an error will be generated stating the buildpack could not be found. 

If a matching release is found, the assets of that release will be searched for an entry with a `content_type` of `application/gzip`. This found asset's `browser_download_url` will become the target for the buildpack download process. If no matching asset is found, GitHub's default tar would become the target. This would fallback would allow repositories that are also a valid CNB to release without uploading an explicit tar.


# Drawbacks
[drawbacks]: #drawbacks

* GitHub API is now in pack

# Alternatives
[alternatives]: #alternatives

* Do nothing, users continue to specify buildpacks on github with explicit release download urls.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- Should a user uploaded tar asset _not_ be found, should we consider **not** using the GitHub archive as the target and instead fail? Only repositories that are also a valid CNB will work. Other repositories will fail later in the process with a missing `buildpack.toml`, `bin/detect` or any other part.
