# Meta
[meta]: #meta
- Name: Buildpack Registry Search API
- Start Date: 2020-11-11
- Author(s): @elbandito
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

An external API service that exposes endpoints for retrieving buildpack metadata against the official CNB buildpack registry.  It's NOT the goal of this API to support private buildpack registries.  I envision this service providing a few GET endpoints to support plain text query searches, and individual buildpack data retrieval.  The API endpoints will be versioned, and follow OpenAPI and/or Json Schema/API standards.

### Versioned Endpoints

All the endpoints defined below will be version via a `vN` prefix to the base URL. e.g. `https://registry.buildpacks.io/api/v1/<endpoint>`.

### Supported Endpoints

- **GET /search?matches=text**

  Retrieves all the buildpacks that satisfy the search query.  If the response contains more than significant number of buildpacks, pagination will be used.  The current approach to pagination is to take inspiration from [Github](https://docs.github.com/en/free-pro-team@latest/rest/guides/traversing-with-pagination).  
  ```
  $ curl https://registry.buildpacks.io/api/v1/search?matches=projectriff
  ```
  ```json
  [
    {
      "latest": {
        "description": "The Command Function Buildpack is a Cloud Native Buildpack V3 that provides riff Command Function Invoker to functions",
        "license": "MIT",
        "ns":"projectriff",
        "name":"command-function",
        "version": "1.4.1",
        "yanked":false,
        "addr":"gcr.io/projectriff/command-function@sha256:99f9054abb73635a9b251b61d3627a8ff86508c767f9d691c426d45e8758596f"  
      },
      "versions": {
        "1.4.1": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/command-function/1.4.1"
        },
        "1.3.9": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/command-function/1.3.9"
        }
      }
    },
    {
      "latest": {
        "description": "The Java Function Buildpack is a Cloud Native Buildpack V3 that provides riff Java Function Invoker to functions",
        "license": "MIT",
        "ns":"projectriff",
        "name":"java-function",
        "version": "1.4.3",
        "yanked":false,
        "addr":"gcr.io/projectriff/java-function@sha256:5eabea8f7b2c09074ec196fe0c321006fb5ad8f282cc918520286d8a0007196f"  
      },
      "versions": {
        "1.4.3": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/java-function/1.4.3"
        },
        "1.3.9": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/java-function/1.3.9"
        }
      }
    },
    {
      "latest": {
        "description": "The Node Function Buildpack is a Cloud Native Buildpack V3 that provides riff Node Function Invoker to functions",
        "license": "MIT",
        "ns":"projectriff",
        "name":"node-function",
        "version": "1.5.6",
        "yanked":false,
        "addr":"gcr.io/projectriff/node-function@sha256:194298b826c15bb079c59aed99968d7678a6e1f7a882c9d7f61811e0990717ba"  
      },
      "versions": {
        "1.5.6": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/node-function/1.5.6"
        },
        "1.3.9": {
          "link": "https://registry.buildpacks.io/api/v1/buildpacks/projectriff/node-function/1.3.9"
        }
      }
    }
  ]
  ```
  
- **GET /buildpacks/:ns/:name**

  Retrieves metadata for a specific buildpack.
  ```
  $ curl https://registry.buildpacks.io/api/v1/buildpacks/projectriff/command-function
  ```
  ```json
  {
    "latest": {
      "description": "The Command Function Buildpack is a Cloud Native Buildpack V3 that provides riff Command Function Invoker to functions",
      "license": "MIT",
      "ns":"projectriff",
      "name":"command-function",
      "version": "1.4.1",
      "yanked":false,
      "addr":"gcr.io/projectriff/command-function@sha256:99f9054abb73635a9b251b61d3627a8ff86508c767f9d691c426d45e8758596f"  
    },
    "versions": {
      "1.4.1": {
        "link": "https://registry.buildpacks.io/buildpacks/api/v1/projectriff/command-function/1.4.1"
      },
      "1.3.9": {
        "link": "https://registry.buildpacks.io/buildpacks/api/v1/projectriff/command-function/1.3.9"
      }
    }
  } 

- **GET /buildpacks/:ns/:name/:version**

  Retrieves metadata for a specific buildpack version (`:version` must be a semver or `latest`).  This response *may* contain more metadata e.g. download metrics.  Since `description` and `license` can change between different versions, it should therefore ONLY be included for each specific buildpack version.
  ```
  $ curl https://registry.buildpacks.io/buildpacks/api/v1/projectriff/command-function/1.4.1
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

Search fields will include `ns`, and `name`. 

In addition, a server process will expose endpoints and handle incoming request for the GET endpoints mentioned earlier.  For search requests, the text will be extracted from the `matches` query parameter and used to search against the normalized buildpacks index.   Results will be added to the server response, as a list of JSON objects.

*Note:  Initially, the Distribution Team maintainers can manage this service, and could even set-up a pager (but only best effort, and during working hours).  In the future, we maybe able to extend this to other verified project contributors.

### Future Work

- Additional query fields will be added for finer grained, exact searches. `ns`, `name`, and `yanked`.  These additional query fields will provide 1:1 mappings to specific metadata fields that provide exact matches.

For example:
```

```

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?
- more vulnerable due to Github outages
- less optimal than using actual DB technology
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
  
  I expect to have an API with a GET endpoint with a `matches` parameter that returns a list of matching buildpacks from the registry index repo.

- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?

  1. A registry dashboard e.g. web-based application with design considerations that provides a clean UX for discovering buildpacks.
  2. Adding metrics e.g. number of downloads, issues, etc. 
  3. Adding additional metadata in either/both the buildpack or buildpack version response objects
