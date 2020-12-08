# Meta
[meta]: #meta
- Name: Buildpack Registry Search API
- Start Date: 2020-11-11
- Author(s): elbandito
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary
This is a proposal for a service API that enables clients to search for buildpacks.

# Definitions
[definitions]: #definitions

**API** - Application Programmer Interface

**Buildpack Registry** - the CNB centeralized [registry](https://github.com/buildpacks/registry-index) that contains metadata for all the community supported buildpacks 

**Service** - an independent web process running in the cloud that provides RESTful endpoints

**Client** - represents a physical end-user or software interface e.g. CLI, web UI, etc.
 
# Motivation
[motivation]: #motivation

As the CNB project makes progress towards supporting a centralized Buildpack Registry, I anticipate the need to quickly search for and identify specific buildpacks.  To support this, I propose the creation of an API search service that customers could use directly and/or indirectly via a web dashboard or CLI.

- What use cases does it support?  
  - Customers looking to quickly indentify usefulful buildpacks to build their applications.
- What is the expected outcome?  
  - Customers will be able to quickly find relevant buildpacks for their use cases.

# What it is
[what-it-is]: #what-it-is

An external API service that exposes endpoints for retrieving buildpack metadata.  Initially, I envision this service providing a few GET endpoints to support plain text query searches, and individual buildpack data retrieval. 

### Supported Endpoints

- **GET /search?query=text**

  Retrievs all the buildpacks that satisfy the search query.  If the response contains more than 20 buildpacks, pagination will be used.  For example:
  ```
  $ curl https://registry.buildpacks.io/search?query=projectriff
  ```
  ```json
  [
    {
      "ns":"projectriff",
      "name":"command-function",
      "version":"1.4.1",
      "yanked":false,
      "addr":"gcr.io/projectriff/command-function@sha256:99f9054abb73635a9b251b61d3627a8ff86508c767f9d691c426d45e8758596f"
    },
    {
      "ns":"projectriff",
      "name":"java-function",
      "version":"1.4.1",
      "yanked":false,
      "addr":"gcr.io/projectriff/java-function@sha256:5eabea8f7b2c09074ec196fe0c321006fb5ad8f282cc918520286d8a0007196f"
    },
    {
      "ns":"projectriff",
      "name":"node-function",
      "version":"1.4.1",
      "yanked":false,
      "addr":"gcr.io/projectriff/node-function@sha256:194298b826c15bb079c59aed99968d7678a6e1f7a882c9d7f61811e0990717ba"
    },
    {
      "ns":"projectriff",
      "name":"streaming-http-adapter",
      "version":"1.4.0",
      "yanked":false,
      "addr":"gcr.io/projectriff/streaming-http-adapter@sha256:b202d9ec203e882ee7e3c599d9e867617f909c8b6123e4ce942af47db6e58c45"
    }
  ]
  ```

- **GET /buildpacks/:ns/:name**

  Retrieves metadata for a specific buildpack.  This response *could* contain more detailed data e.g. download metrics.
  ```
  $ curl https://registry.buildpacks.io/buildpacks/projectriff/command-function
  ```
  ```json
  {
      "description": "The Command Function Buildpack is a Cloud Native Buildpack V3 that provides riff Command Function Invoker to functions",
      "license": "MIT",
      "ns":"projectriff",
      "name":"command-function",
      "version": "1.4.1",
      "yanked":false,
      "addr":"gcr.io/projectriff/command-function@sha256:99f9054abb73635a9b251b61d3627a8ff86508c767f9d691c426d45e8758596f"
  }
  ```

# How it Works
[how-it-works]: #how-it-works

In the initial implementation, we can take advantage of the existing [registry](https://github.com/buildpacks/registry-index) repository to pull buildpack data from.  To keep ensure up-to-date buildpack data, we'd have a polling loop that performs a `git pull`.  This polling would take place in a separate background process.  

Each time the local repository has been updated via `git pull`, buildpack data will be processed/normalized into a single JSON object, where plain text searches can be used against it.   Fields in this JSON object will be re-indexed as searchable fields, which will be compared against the search text during the retrieval algorithm.

Search fields will include `ns`, `name`, `license`, and `yanked`. 

In addition, a server process will expose endpoints and handle incoming request for the GET endpoints mentioned earlier.  For search requests, the text will be extracted from the `query` query parameter and used to search against the normalized buildpacks index.   Results will be added to the server response, as a list of JSON objects.

*Note:  Initially, the Distribution Team maintainers can manage this service, and could even set-up a pager (but only best effort, and during working hours).  In the future, we maybe able to extend this to other verified project contributors.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?
- more vulnerable due to Github outages
- less optimal than using actual DB technology
- constraint by what's in the index registry repository.  We might want to augment the metadata, with new fields that don't makes sense to have in the index repository.  I think this maybe an issue for the `/buildpacks/1` endpoint that *could* have download data, etc. things that don't belong in the actual repo.
- without a DB we can't easily do things like ORDER_BY, or use ASC|DESC
- someone has to maintain the service


# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?

  - Do nothing
  
    We already have buildpack metadata stored in the [registry](https://github.com/buildpacks/registry-index).  
    Customers can simply explore this repository for buildpack information.  Perhaps someone else in the community will
    come up with their own solution that can be donated to CNB.

  - Having a separate, independent service responsible for:
    1. pulling from the registry-index repository
    2. augmenting buildpack data
    3. persisting it to a hosted PostgresDB  

- Why is this proposal the best?

  Seems like a good first iterative step that's easy to implement with less moving parts. 
  Helps us to quickly get something out there for customers to experiment with (MVP).

- What is the impact of not doing this?

  Customers will struggle to find relevant buildpacks to aid them in their development.  
 
 
# Prior Art
[prior-art]: #prior-art

  1. [Ruby Gems](https://rubygems.org/)
  2. [npm](https://www.npmjs.com/)
  3. [Rust](https://crates.io/)
  4. [Dockerhub](https://hub.docker.com/)
  5. [Tekton Hub](https://hub-preview.tekton.dev/)

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?

- What parts of the design do you expect to be resolved through implementation of the feature?
  
  I expect to have an API with a GET endpoint with a `query` parameter that returns a list of matching buildpacks from the registry index repo.

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

  1. A registry dashboard e.g. web-based application with design considerations that provides a clean UX for discovering Buildpacks.
  2. Adding metrics e.g. number of downloads, issues, etc. or any other metadata to the buildpack.
