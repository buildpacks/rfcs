import { updateComment } from "../src/comment";

describe("#updateComment", function () {

    describe("no previous comment exists", function () {
        test('no amendments', async () => {
            let newComment = updateComment("", [])
            expect(newComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

__(none)__
`)
        })

        test('with additions', async () => {
            let newComment = updateComment("", [{
                op: "add",
                issue: {
                    repo: "org/repo1",
                    title: "Issue 1",
                    labels: []
                }
            }, {
                op: "add",
                issue: {
                    repo: "org/repo2",
                    title: "Issue 2",
                    labels: ["label-1"]
                }
            }])

            expect(newComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`)
        })
    })

    describe("previous comment exists", function () {
        test("adding an issue", function () {
            let newComment = updateComment(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`,
                [{
                    op: "add",
                    issue: {
                        repo: "org/repo3",
                        title: "Issue 3",
                        labels: ["label-1", "label 2"]
                    }
                }])

            expect(newComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
  * cf07a9 - org/repo3 "Issue 3" [label-1][label 2]
`)
        })
    })
})