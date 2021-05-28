import {parseUserComment} from '../src/parse'

describe('#parseUserComment', function () {
  describe('queue-issue', function () {
    test('queue-issue with title only', async () => {
      let actions = parseUserComment(`/queue-issue org/repo "my title"`)
      expect(actions).toHaveLength(1)
      expect(actions[0]).toEqual({
        op: 'add',
        issue: {repo: 'org/repo', title: 'my title', labels: []}
      })
    })

    test('queue-issue with quotes in title', async () => {
      let actions = parseUserComment(
        `/queue-issue org/repo 'title with "quotes"'`
      )
      expect(actions).toHaveLength(1)
      expect(actions[0]).toEqual({
        op: 'add',
        issue: {
          repo: 'org/repo',
          title: `title with "quotes"`,
          labels: []
        }
      })
    })

    test('queue-issue with labels', async () => {
      let actions = parseUserComment(
        `/queue-issue org/repo "my title" [label-1][label 2]`
      )
      expect(actions).toHaveLength(1)
      expect(actions[0]).toEqual({
        op: 'add',
        issue: {
          repo: 'org/repo',
          title: `my title`,
          labels: ['label-1', 'label 2']
        }
      })
    })

    test('queue multiple issues', async () => {
      let actions = parseUserComment(`
/queue-issue org/repo "issue 1"
/queue-issue org/repo "issue 2" [label-1][label 2]
      `)
      expect(actions).toHaveLength(2)
      expect(actions[0]).toEqual({
        op: 'add',
        issue: {repo: 'org/repo', title: `issue 1`, labels: []}
      })
      expect(actions[1]).toEqual({
        op: 'add',
        issue: {
          repo: 'org/repo',
          title: `issue 2`,
          labels: ['label-1', 'label 2']
        }
      })
    })

    test('queue multiple issues with other comment', async () => {
      let actions = parseUserComment(`This are the issues we should create:

/queue-issue org/repo "issue 1"
/queue-issue org/repo "issue 2" [label-1][label 2]`)
      expect(actions).toHaveLength(2)
      expect(actions[0]).toEqual({
        op: 'add',
        issue: {repo: 'org/repo', title: `issue 1`, labels: []}
      })
      expect(actions[1]).toEqual({
        op: 'add',
        issue: {
          repo: 'org/repo',
          title: `issue 2`,
          labels: ['label-1', 'label 2']
        }
      })
    })
  })

  describe('unqueue-issue', function () {
    test('unqueue-issue single issue', async () => {
      let actions = parseUserComment(`/unqueue-issue aB123`)
      expect(actions).toHaveLength(1)
      expect(actions[0]).toEqual({op: 'remove', uid: 'aB123'})
    })

    test('unqueue-issue multiple issues', async () => {
      let actions = parseUserComment(`
/unqueue-issue aB123
/unqueue-issue zy987
`)
      expect(actions).toHaveLength(2)
      expect(actions[0]).toEqual({op: 'remove', uid: 'aB123'})
      expect(actions[1]).toEqual({op: 'remove', uid: 'zy987'})
    })
  })
})
