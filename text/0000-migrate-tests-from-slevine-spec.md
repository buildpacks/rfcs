# Meta
[meta]: #meta
- Name: Migrate Test Framework from sclevine/spec
- Start Date: 2026-06-22
- Author(s): @jkutner
- Status: Draft
- RFC Pull Request: (leave blank)
- CNB Pull Request: (leave blank)
- CNB Issue: (leave blank)
- Supersedes: N/A

# Summary
[summary]: #summary

This RFC proposes migrating the lifecycle project's test suite from the `sclevine/spec` BDD testing framework to native Go testing using `t.Run` subtests, `t.Cleanup`, and the existing `go-cmp` based assertion helpers. The migration covers 89 test files comprising approximately 24,500 lines of test code, 929 individual test cases, and 856 grouping blocks. The primary motivation is eliminating an unmaintained external dependency, improving contributor accessibility, and achieving full compatibility with standard Go tooling without introducing a new framework dependency.

# Definitions
[definitions]: #definitions

- **sclevine/spec**: A BDD-style testing framework for Go created by Stephen Levine, providing `when`/`it`/`it.Before`/`it.After` constructs. Last tagged release: v1.4.0 (2019).
- **BDD**: Behavior-Driven Development, a testing style that uses descriptive natural-language constructs to specify behavior.
- **Subtest**: A Go test created via `t.Run("name", func(t *testing.T) {...})`, providing hierarchical test organization within the standard library.
- **Scoped setup**: An `it.Before()` call nested inside a `when()` block that runs before every `it()` within that specific scope, providing fresh state per test case.
- **testify**: The `github.com/stretchr/testify` package, providing assertion helpers and suite-based test organization.
- **Ginkgo/Gomega**: A BDD testing framework (`github.com/onsi/ginkgo/v2`) and matcher library (`github.com/onsi/gomega`) for Go.
- **go-cmp**: The `github.com/google/go-cmp` package, already a direct dependency, providing rich comparison and diff output for Go values.

# Motivation
[motivation]: #motivation

- **Unmaintained dependency**: `sclevine/spec` has not had a tagged release since v1.4.0 (2019) and has minimal recent activity. For a critical piece of CNCF infrastructure, depending on a single-maintainer, dormant package introduces long-term maintenance risk.
- **Contributor onboarding friction**: The `when`/`it` BDD pattern is uncommon in the Go ecosystem. New contributors (a frequent occurrence in CNCF projects) must learn an unfamiliar testing DSL before they can write or modify tests.
- **Tooling gaps**: IDE test runners (VS Code with gopls, GoLand) cannot natively discover and run individual `it()` blocks with full click-to-run support. Coverage tools, `go test -json`, and CI integrations work best with standard subtests.
- **Supply-chain simplification**: Removing `sclevine/spec` and its `spec/report` sub-package eliminates external test framework code from the dependency graph entirely.
- **Expected outcome**: A test suite that any Go developer can immediately read, navigate, and run using only `go test` and standard IDE features, with zero external test framework dependencies.

# What it is
[what-it-is]: #what-it-is

A migration of all 89 test files from `sclevine/spec` BDD-style tests to idiomatic Go subtests using the standard `testing` package. The migration preserves the existing `testhelpers` package (for domain-specific utilities like Docker helpers, tar helpers, and temp directory management) while replacing the framework-specific patterns with native Go equivalents. The existing `go-cmp` based assertion helpers (`h.AssertEq`, `h.AssertNil`, etc.) are retained and improved rather than replaced with a third-party assertion library.

This is NOT:
- A rewrite of test logic or coverage
- An introduction of a new testing framework (testify/suite, Ginkgo)
- A change to the `testhelpers` utility functions (file helpers, Docker helpers)
- A change to mock generation (gomock remains)

# How it Works
[how-it-works]: #how-it-works

## Transformation Patterns

| Current Pattern | Native Go Equivalent |
|---|---|
| `spec.Run(t, "Name", testFn, spec.Report(...))` | Remove; inline test structure into `TestName(t *testing.T)` |
| `func testX(t *testing.T, when spec.G, it spec.S)` | Flatten into `func TestX(t *testing.T)` with nested `t.Run` |
| `when("description", func() { ... })` | `t.Run("description", func(t *testing.T) { ... })` |
| `it("description", func() { ... })` | `t.Run("description", func(t *testing.T) { ... })` |
| `it.Before(func() { ... })` | Setup helper function called at the start of each leaf `t.Run`, or setup code at top of enclosing `t.Run` when subtests do not mutate shared state |
| `it.After(func() { ... })` | `t.Cleanup(func() { ... })` registered at the appropriate scope |
| `spec.Parallel()` | `t.Parallel()` at the top of `TestX` and inside each sub-`t.Run` |
| `spec.Sequential()` | Default behavior (no annotation needed) |
| `spec.Report(report.Terminal{})` | Remove entirely; use `go test -v` for verbose output |

## Handling Scoped `it.Before` (Critical Pattern)

The most important semantic difference is that `it.Before()` inside a `when()` block runs fresh before every `it()` in that scope. There are approximately 223 scoped `it.Before` blocks in the codebase. Each requires one of these approaches:

**Option A -- Setup function called per leaf test (preferred for mutable state):**
```go
t.Run("app image exists", func(t *testing.T) {
    setup := func() *fakes.Image {
        return fakes.NewImage("app", "", nil)
    }
    t.Run("does X", func(t *testing.T) {
        fakeAppImage := setup()
        // test using fakeAppImage
    })
    t.Run("does Y", func(t *testing.T) {
        fakeAppImage := setup()
        // test using fresh fakeAppImage
    })
})
```

**Option B -- Top-of-closure setup (acceptable when subtests do not mutate shared state):**
```go
t.Run("app image exists", func(t *testing.T) {
    fakeAppImage := fakes.NewImage("app", "", nil)
    t.Run("reads metadata", func(t *testing.T) {
        // read-only access to fakeAppImage -- safe
    })
    t.Run("checks labels", func(t *testing.T) {
        // read-only access to fakeAppImage -- safe
    })
})
```

**Decision criteria**: If any `it()` within the scope mutates the state set up by `it.Before()`, use Option A. If all `it()` blocks only read the state, Option B is safe and more concise.

## Handling the `each()` Helper

The custom `each()` helper in `buildpack/build_test.go` (which takes `spec.S` as a parameter to generate multiple `it()` calls) will be converted to accept `*testing.T` and use `t.Run` internally, or restructured as a table-driven test pattern.

## Assertion Helpers

The existing `testhelpers` assertion functions (`h.AssertEq`, `h.AssertNil`, `h.AssertStringContains`, etc.) remain unchanged. They already accept `*testing.T` and use `go-cmp` for comparison output. No third-party assertion library is introduced.

## Example Conversion

```go
// BEFORE
func TestRebaser(t *testing.T) {
    spec.Run(t, "Rebaser", testRebaser, spec.Report(report.Terminal{}))
}

func testRebaser(t *testing.T, when spec.G, it spec.S) {
    var rebaser phase.Rebaser
    it.Before(func() {
        rebaser = phase.Rebaser{Force: false}
    })
    when("force is true", func() {
        it.Before(func() {
            rebaser.Force = true
        })
        it("warns and overrides", func() {
            h.AssertEq(t, rebaser.Force, true)
        })
    })
}

// AFTER
func TestRebaser(t *testing.T) {
    setup := func() phase.Rebaser {
        return phase.Rebaser{Force: false}
    }
    t.Run("force is true", func(t *testing.T) {
        rebaser := setup()
        rebaser.Force = true
        t.Run("warns and overrides", func(t *testing.T) {
            h.AssertEq(t, rebaser.Force, true)
        })
    })
}
```

# Migration
[migration]: #migration

## Effort Estimate

| File Category | Count | Per-File Estimate | Total |
|---|---|---|---|
| Small files (< 100 lines) | ~20 | 15-30 min | 5-10 hours |
| Medium files (100-500 lines) | ~50 | 45-90 min | 37-75 hours |
| Large files (500-1000 lines) | ~12 | 2-3 hours | 24-36 hours |
| Very large files (1000+ lines) | 7 | 4-6 hours | 28-42 hours |

**Base estimate: 15-18 person-days** for mechanical transformation and testing.
**With scoped-before analysis buffer: 18-22 person-days** (accounting for the 223 scoped `it.Before` blocks that require human judgment about mutation patterns).

## Phased Plan

### Phase 1: Tooling and Validation (2-3 days)
- Develop an AST-based transformation tool that handles mechanical conversions:
  - Remove `spec` and `spec/report` imports
  - Convert `spec.Run(...)` calls to direct test functions
  - Convert `when("x", func() {` to `t.Run("x", func(t *testing.T) {`
  - Convert `it("x", func() {` to `t.Run("x", func(t *testing.T) {`
  - Convert `it.After(func() {` to `t.Cleanup(func() {`
  - Add `t.Parallel()` where `spec.Parallel()` was used
- Validate tool output on the 5 smallest files
- Establish CI gate: `go test -v -count=5 -race ./...`

### Phase 2: Small and Medium Files (5-7 days)
- Apply the transformation tool to the ~70 files under 500 lines
- Manually review and fix scoped `it.Before` conversions (apply Option A or B per case)
- Ensure each package passes `go test -race -count=10` before proceeding
- Submit in batches of 5-10 files per PR for manageable code review

### Phase 3: Large and Very Large Files (5-7 days)
- Convert the 19 files over 500 lines with careful attention to:
  - Deep nesting (5-6 levels in rebaser, detector, exporter tests)
  - Layered `it.Before` blocks that build state incrementally
  - The `each()` helper function signature change
  - Parallel test files (32 files needing `t.Parallel()` propagation)
- Where nesting exceeds 5 levels, evaluate whether flattening into table-driven tests improves clarity (but do not mandate restructuring)
- Run under `-race -count=100` to catch state-sharing regressions

### Phase 4: Cleanup and Finalization (2-3 days)
- Remove `github.com/sclevine/spec` from go.mod
- Remove `github.com/sclevine/spec/report` imports
- Update CONTRIBUTING.md with new test patterns and conventions
- Run full CI pipeline validation
- Final PR review

### Coexistence During Migration

Both patterns can coexist since they both ultimately produce standard `*testing.T` subtests. Migration can proceed package-by-package without blocking other development work. The existing test suite continues to pass at every intermediate stage.

# Drawbacks
[drawbacks]: #drawbacks

**Verbosity increase (5-10% more lines of test code).** Replacing `when("x", func() {` with `t.Run("x", func(t *testing.T) {` adds characters per line and requires explicit `t *testing.T` parameters at every nesting level. Across 24,500 lines, this adds approximately 1,200-2,500 lines of boilerplate. For deeply nested files (6 levels), the indentation and closing braces become visually dense.

**Loss of BDD semantic distinction.** The `when`/`it` naming convention communicates intent: `when` describes a condition, `it` describes expected behavior. With `t.Run`, both become generic subtests. The descriptive names are preserved in test output, but the code loses the semantic signal that distinguishes setup context from assertion.

**Scoped `it.Before` conversion requires human judgment.** Each of the 223 scoped setup blocks must be individually assessed for whether subtests mutate shared state. Incorrect assessment introduces subtle test pollution bugs that may only manifest intermittently. This is the primary source of migration risk.

**The `each()` helper requires non-trivial refactoring.** It currently accepts `spec.S` and dynamically generates `it()` calls. Converting this to table-driven tests or a `t.Run`-based helper changes the test structure, not just syntax.

**Opportunity cost.** 18-22 person-days of engineering time spent on migration is time not spent on features, bug fixes, or other improvements to the lifecycle project.

**No improvement to assertion ergonomics.** Unlike testify or Gomega, this migration does not upgrade assertion capabilities. The existing `h.Assert*` helpers remain, with their current error message quality (already good via `go-cmp`, but not as rich as dedicated assertion libraries).

# Alternatives
[alternatives]: #alternatives

## Alternative A: Migrate to testify/suite + testify/assert

**Design:** Convert each test file to a `suite.Suite` struct with `SetupTest`/`TearDownTest` lifecycle methods and `assert`/`require` assertions.

**Advantages:**
- testify v1.11.1 is already an indirect dependency (zero new supply-chain risk)
- testifylint v1.6.4 is already an indirect dependency (static analysis for free)
- 60+ assertion functions with excellent error messages
- Universal recognition among Go developers
- Suite methods are individually runnable and IDE-navigable
- `SetupSubTest()`/`TearDownSubTest()` provides per-subtest lifecycle hooks

**Disadvantages:**
- `SetupTest()` runs for ALL test methods in a suite, creating a fundamental mismatch with scoped `it.Before()`. The 223 scoped setup blocks either require proliferating many small suite structs per file (e.g., `RebaserForceSuite`, `RebaserNoForceSuite`) or using `s.Run()` subtests with inline setup -- which negates the suite benefit.
- Introduces an OOP mental model (struct fields, method receivers, embedding) that is not idiomatic Go testing.
- Argument order swap (`assert.Equal(expected, actual)` vs. `h.AssertEq(actual, expected)`) across 1,239 calls requires careful attention.
- testify/suite is less widely adopted than testify/assert alone; many developers know the assertions but not the suite pattern.
- Adds `github.com/stretchr/objx` and `github.com/davecgh/go-spew` as transitive runtime dependencies.

**Estimated effort:** 12-18 person-days (the scoped-before problem may push this to 16-22 when accounting for suite proliferation or `s.Run()` restructuring).

## Alternative B: Migrate to Ginkgo/Gomega

**Design:** Convert to Ginkgo's BDD framework with `Describe`/`Context`/`It`/`BeforeEach`/`AfterEach` constructs and Gomega matchers.

**Advantages:**
- Closest 1:1 mapping to the existing BDD structure (`when` -> `Context`, `it` -> `It`, `it.Before` -> `BeforeEach`)
- `BeforeEach` at any nesting level preserves scoped setup semantics exactly -- the 223 scoped `it.Before` blocks convert mechanically with zero design decisions
- Rich matcher library (Gomega) with composable matchers, async assertions (`Eventually`/`Consistently`)
- First-class parallel execution via `ginkgo -p`
- Used by Kubernetes (e2e), Cloud Foundry, and other CNCF projects
- Lowest structural risk during migration (pure renaming exercise)

**Disadvantages:**
- Large dependency footprint (Ginkgo runtime, Gomega, transitive deps including protobuf, golang.org/x/net)
- Requires separate `ginkgo` CLI binary for advanced features (parallel execution, watch mode, label filtering)
- Idiomatic usage requires dot-imports (`. "github.com/onsi/ginkgo/v2"`) which pollute the package namespace and are flagged by many linters
- Replaces one BDD framework with a larger, more opinionated BDD framework -- does not address the fundamental concern that BDD patterns are unfamiliar to most Go developers
- Ginkgo's execution model has subtleties (node types, spec phases, goroutine restrictions on `Expect`) that create a new learning curve
- History of breaking changes between major versions (v1 to v2 migration was painful for many projects)
- Random spec ordering by default may expose latent ordering dependencies during migration, creating debugging work unrelated to the framework change

**Estimated effort:** 12-18 person-days (the 1:1 mapping keeps this estimate tight, but team learning curve and CI tooling changes add ongoing cost).

## Why Native Go Testing is Recommended

1. **Long-term maintenance cost is zero.** The `testing` package has been stable since Go 1.0 and will remain so. No framework upgrades, no breaking version changes, no compatibility issues with future Go releases.

2. **Maximum contributor accessibility.** Every Go developer knows `t.Run`, `t.Cleanup`, and `t.Parallel()`. No documentation needed, no learning curve, no framework-specific gotchas.

3. **Perfect tooling integration, permanently.** `go test -run`, `go test -json`, `go test -cover`, `go test -race`, IDE test runners, debuggers, and coverage tools all work without any configuration or plugins.

4. **Eliminates framework dependency entirely.** Neither testify nor Ginkgo achieves this. The project goes from depending on an unmaintained framework to depending on no framework.

5. **The verbosity cost is bounded and honest.** The 5-10% LOC increase is the transparent cost of simplicity. The other options hide complexity in framework abstractions that must be understood, maintained, and debugged.

6. **The scoped-before problem is solvable.** While it requires human judgment (unlike Ginkgo's mechanical mapping), the resulting code makes state management explicit rather than implicit -- which is a long-term readability improvement.

## Impact of Not Doing This

If no migration occurs:
- The project continues depending on an unmaintained framework (last release 2019)
- Contributors continue facing an unfamiliar testing DSL
- IDE test integration remains suboptimal
- The framework will eventually become incompatible with a future Go version, forcing an emergency migration under time pressure

# Prior Art
[prior-art]: #prior-art

- **Kubernetes**: Uses native Go testing for unit tests and Ginkgo for e2e tests. The separation acknowledges that unit tests benefit from simplicity while integration tests may need orchestration features.
- **Docker/Moby**: Uses native Go testing throughout with custom test helpers. Demonstrates that large, complex projects succeed without BDD frameworks.
- **Terraform**: Uses native Go testing with testify/assert for assertions (but not testify/suite). Demonstrates the "native structure + assertion library" middle ground.
- **containerd**: Uses native Go testing, showing that container ecosystem projects do not require BDD frameworks.
- **The Go standard library itself**: All tests use native patterns, serving as the canonical reference for Go test style.
- **Cloud Foundry CLI**: Migrated from custom testing to Ginkgo early in its lifecycle and has remained there, but this is a different architectural context (CLI integration tests vs. library unit tests).

# Unresolved Questions
[unresolved-questions]: #unresolved-questions

1. **Should the `h.Assert*` helpers be improved during migration?** The current helpers produce good output via `go-cmp` but could be enhanced (e.g., adding source location via `t.Helper()`). This could be done as part of the migration or as a follow-up.

2. **Should deeply nested tests (6+ levels) be restructured during migration or converted verbatim?** Restructuring improves long-term readability but increases migration effort and risk. A conservative approach converts verbatim first and restructures in follow-up PRs.

3. **What is the threshold for choosing Option A (per-test setup function) vs. Option B (top-of-closure setup)?** A clear guideline is needed for the 223 scoped `it.Before` blocks to ensure consistency across the codebase.

4. **Should the AST transformation tool be contributed to the community?** Other projects using `sclevine/spec` may benefit from a migration tool.

5. **How should the `each()` helper in `buildpack/build_test.go` be restructured?** Table-driven tests are the most idiomatic approach but change the test's conceptual structure.

# Spec. Changes (OPTIONAL)
[spec-changes]: #spec-changes

No changes to the CNB specification are required. This RFC affects only the lifecycle project's internal test infrastructure.

# History
[history]: #history

- 2026-06-22: Initial RFC draft synthesized from technical debate between advocates for native Go testing, testify/suite, and Ginkgo/Gomega.