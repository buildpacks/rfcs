# Meta
[meta]: #meta
- Name: Primary Buildpack
- Start Date: 2019-11-11
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: (put "N/A" unless this replaces an existing RFC, then link to that RFC)

# Summary
[summary]: #summary

Every build with a set of buildpacks has one buildpack that can be considered the "primary" for a particular process type (e.g. web). That is, this buildpack should always override defaults set by other buildpacks, regardless of order.

# Motivation
[motivation]: #motivation

## Background

When multiple buildpacks are used for an application, situations may arise where they behave differently depending on the order they are run in, or where one of the buildpacks affects the other in a particular fashion regardless of the order they have been defined in.

This causes unpredictable and often confusing situations for users, whose applications then behave unexpectedly due to invisible internal behavior of the buildpacks used.

Some aspects of the v3 spec already solve some of the weaknesses of the v2 spec in that regard (in particular alphanumerical order of execution for `.profile.d/` scripts), but gaps remain when users define buildpacks in an order that does not reflect their runtime priority.

## Examples

### `.profile.d` filename dictates execution order

Suppose you wanted to write a buildpack that provides the JVM, which you then use together with buildpacks optimized for JRuby and for Java.

Each of these buildpacks will provide binaries, and the JRuby and Java buildpacks will rely on the JVM buildpack's `java` command to perform certain operations.

At build time, this problem is solved with [the `export` Bash script a buildpack can generate](https://devcenter.heroku.com/articles/buildpack-api#composing-multiple-buildpacks) (v2 API), or a `<layers>/<layer>/env.build/` entry.

At runtime, however, so-called *profile scripts* containing e.g. the relevant `export PATH=…` lines must be sourced by the shell. This is commonly done by amending `/etc/profile` with logic that sources all `.sh` files from a `.profile.d/` folder in the application root:

```
…
if [ -d /app/.profile.d ]; then
  for i in /app/.profile.d/*.sh; do
    if [ -r $i ]; then
      . $i
    fi
  done
  unset i
fi
…
```

Let's assume the JVM buildpack created a `.profile.d/jvm.sh` that contained just one line:

```
export PATH=/path/to/jvm/from/jvm-buildpack/bin
```

The Java buildpack, meanwhile, needs to set some `$JAVA_OPTS` defaults on application startup, depending on the JVM version used; its `.profile.d/java.sh` script looks like this:

```
if java --version | grep 1.8; then
	export JAVA_OPTS=…
else
	export JAVA_OPTS=…
fi
```

Because `/etc/profile` uses a wildcard to find all `.profile.d/*.sh` files, and [because glob patterns are expanded in alphanumerical order](https://www.gnu.org/savannah-checkouts/gnu/bash/manual/bash.html#Filename-Expansion), the `java.sh` script will be sourced before the `jvm.sh` script, and the `java` command thus can't be invoked, as the binary is not on `$PATH` yet - `jvm.sh` is sourced after `java.sh`, because of alphabetical order.

This problem is already solved in the v3 version of the buildpacks spec, which mandates that `<layers>/<layer>/profile.d/`...:

> If using an execution strategy involving Bash, the lifecycle MUST use a single Bash process to
>  1. source each file in each `<layers>/<layer>/profile.d` directory,
>      1. Firstly, **in order of /bin/build execution used to construct the OCI image**.
>      1. Secondly, in alphabetically ascending order by layer directory name.
>      1. Thirdly, in alphabetically ascending order by file name.

It is also solved by the `<layers>/<layer>/env.launch/` part of the spec, but that only works for static environment variable values. If environment variables are computed (see next section), the `.profile.d` approach must be used.

### Environment variable defaults

Several Heroku buildpacks (Ruby, Python, PHP, Node.js) have, for quite some time, used the environment variable `$WEB_CONCURRENCY` to control the number of worker processes or threads of an application at runtime.

The calculation for a suitable default for `$WEB_CONCURRENCY` is done at application start time, using a `.profile.d` script, so that the language runtime, or a web server, picks it up accordingly. This calculation is normally done based on known characteristics of the underlying system (such as available RAM or CPU cores), and a default value won't be set if the environment variable already exists, as that would mean it has been manually defined by a user.

It is not uncommon for users of all languages to use Node.js based toolchains that invoke `node` or `npm`, for instance for asset compilation. Since users often want those operations performed after the main application language's buildpack has finished installing all necessary dependencies, many users have both their primary language and a Node.js buildpack set, with the Node.js buildpack second in the list, so that its default `npm install` step will, through built-in hooks, also perform asset compilation.

The opposite is just as plausible; assume e.g. a Node.js app that uses Python for a worker process.

If the Python buildpack and the Node.js buildpack are used together, then Node.js's default for `$WEB_CONCURRENCY` always wins: `.profile.d/python.sh` is sourced after `.profile.d/nodejs.sh` (again because of alphabetical order), and so the Python script sees a `$WEB_CONCURRENCY` variable already in the environment. It can't tell whether it was set by the user or by another buildpack's default logic, and it also wouldn't know whether it was the primary "web" process type language or not. The Python application will then use the number of processes/threads for web traffic as calculated by the Node.js buildpack, which obviously may be substantially off the correct number.

The Heroku PHP buildpack, on the other hand, sets `$WEB_CONCURRENCY` not at application startup time, but when the web process is actually launched through a so-called boot script. No logic exists in a `.profile.d` script, so if any other buildpack that exports a default for `$WEB_CONCURRENCY` is used together with the PHP buildpack, the PHP buildpack's boot script will pick up that variable, regardless of alphabetical order.

#### Hotfix to guarantee order wins

The specific issue of `$WEB_CONCURRENCY` was fixed in Heroku buildpacks by having all buildpacks use the same file name for the `.profile.d` script: `.profile.d/WEB_CONCURRENCY.sh`. The PHP buildpack only writes an empty file to that location, overwriting a previously written file from e.g. the Node.js buildpack.

This does not fix the issue of customers with an incorrect order of buildpacks (setting PHP first and Node.js second for a PHP app), but at least it prevents problems where buildpacks that set `$WEB_CONCURRENCY` in a `.profile.d` script incorrectly influence buildpacks that do so at app boot time even when the buildpack order is correct.

### Node.js `$PATH` order broke PHP applications on Heroku

*This is not a problem that needs this RFC to be addressed, but it is included here to illustrate how order matters.*

In 2015, several Heroku customers using the PHP buildpack together with certain Node.js packages reported a problem where their applications would no longer boot after they had deployed a change. The reason was that one of the Node.js packages used had a dependency on [node-which](https://github.com/npm/node-which/pull/20), which serves as a Node.js implementation of the Unix `which` command. The PHP buildpack called `which` on several programs during its boot logic at application runtime, and the Node.js implementation of the `which` program [didn't behave the same way as original Unix version](https://github.com/npm/node-which/issues/19).

Because the Node.js buildpack prepended the `node_modules/.bin/` directory to the `$PATH` environment variable in its `.profile.d/` shell startup script, the PHP buildpack's `heroku-php-apache2` boot Bash script, when invoking the `which` command, actually called the `node-which` program, not the system `which` program.

The solution, in this case, was to change the Node.js `.profile.d` script to append, rather than prepend, `node_modules/.bin/` to `$PATH`.

## WIP: Possible proposals

- make the last buildpack the primary one by default?
- consider requiring a "primary" flag when using multiple buildpacks?

# What it is
[what-it-is]: #what-it-is

This provides a high level overview of the feature.

- Define any new terminology.
- Define the target persona: buildpack author, buildpack user, platform operator, platform implementor, and/or project contributor.
- Explaining the feature largely in terms of examples.
- If applicable, provide sample error messages, deprecation warnings, or migration guidance.
- If applicable, describe the differences between teaching this to existing users and new users.

# How it Works
[how-it-works]: #how-it-works

This is the technical portion of the RFC, where you explain the design in sufficient detail.

The section should return to the examples given in the previous section, and explain more fully how the detailed proposal makes those examples work.

# Drawbacks
[drawbacks]: #drawbacks

Why should we *not* do this?

# Alternatives
[alternatives]: #alternatives

- What other designs have been considered?
- Why is this proposal the best?
- What is the impact of not doing this?

# Prior Art
[prior-art]: #prior-art

Discuss prior art, both the good and bad.

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

- What parts of the design do you expect to be resolved before this gets merged?
- What parts of the design do you expect to be resolved through implementation of the feature?
- What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?
