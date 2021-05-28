import {updateBotComment} from '../src/bot-comment'

describe('#updateBotComment', function () {
  describe('no previous comment exists', function () {
    test('no amendments', async () => {
      let {updatedComment, errors} = updateBotComment('', [])

      expect(errors).toHaveLength(0)
      expect(updatedComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

__(none)__
`)
    })

    test('with additions', async () => {
      let {updatedComment, errors} = updateBotComment('', [
        {
          op: 'add',
          issue: {
            repo: 'org/repo1',
            title: 'Issue 1',
            labels: []
          }
        },
        {
          op: 'add',
          issue: {
            repo: 'org/repo2',
            title: 'Issue 2',
            labels: ['label-1']
          }
        }
      ])

      expect(errors).toHaveLength(0)
      expect(updatedComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`)
    })
  })

  describe('previous comment exists', function () {
    test('adding an issue', function () {
      let {updatedComment, errors} = updateBotComment(
        `Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`,
        [
          {
            op: 'add',
            issue: {
              repo: 'org/repo3',
              title: 'Issue 3',
              labels: ['label-1', 'label 2']
            }
          }
        ]
      )

      expect(errors).toHaveLength(0)
      expect(updatedComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
  * cf07a9 - org/repo3 "Issue 3" [label-1][label 2]
`)
    })

    describe('remove', function () {
      test('issue', function () {
        let {updatedComment, errors} = updateBotComment(
          `Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`,
          [
            {
              op: 'remove',
              uid: '14b156'
            }
          ]
        )

        expect(errors).toHaveLength(0)
        expect(updatedComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * d1dc9d - org/repo2 "Issue 2" [label-1]
`)
      })

      test('non-existent issue', function () {
        let {updatedComment, errors} = updateBotComment(
          `Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`,
          [
            {
              op: 'remove',
              uid: 'non-existent'
            }
          ]
        )

        expect(errors).toHaveLength(1)
        expect(errors[0]).toMatch(`Issue with uid 'non-existent' not found!`)
        expect(updatedComment).toMatch(`Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

  * 14b156 - org/repo1 "Issue 1"
  * d1dc9d - org/repo2 "Issue 2" [label-1]
`)
      })
    })
  })
})
