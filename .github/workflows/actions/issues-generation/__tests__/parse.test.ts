import { parse } from '../src/parse'

describe("#parse", function () {

  describe("queue-issue", function () {
    test('queue-issue with title only', async () => {
      let { actions, errors } = parse(`/queue-issue org/repo "my title"`)
      expect(errors).toHaveLength(0);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({ repo: "org/repo", title: "my title", labels: [] });
    })

    test('queue-issue with quotes in title', async () => {
      let { actions, errors } = parse(`/queue-issue org/repo 'title with "quotes"'`)
      expect(errors).toHaveLength(0);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({ repo: "org/repo", title: `title with "quotes"`, labels: [] });
    })

    test('queue-issue with labels', async () => {
      let { actions, errors } = parse(`/queue-issue org/repo "my title" [label-1][label 2]`)
      expect(errors).toHaveLength(0);
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({ repo: "org/repo", title: `my title`, labels: ["label-1", "label 2"] });
    })


    test('queue multiple issues', async () => {
      let { actions, errors } = parse(`
/queue-issue org/repo "issue 1"
/queue-issue org/repo "issue 2" [label-1][label 2]
      `)
      expect(errors).toHaveLength(0);
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ repo: "org/repo", title: `issue 1`, labels: [] });
      expect(actions[1]).toEqual({ repo: "org/repo", title: `issue 2`, labels: ["label-1", "label 2"] });
    })

    test('queue multiple issues with other comment', async () => {
      let { actions, errors } = parse(`This are the issues we should create:

/queue-issue org/repo "issue 1"
/queue-issue org/repo "issue 2" [label-1][label 2]`)
      expect(errors).toHaveLength(0);
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ repo: "org/repo", title: `issue 1`, labels: [] });
      expect(actions[1]).toEqual({ repo: "org/repo", title: `issue 2`, labels: ["label-1", "label 2"] });
    })
  })
})
