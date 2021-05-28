import hash from 'hash.js'
import {QueuedIssue, Operation, parseIssue} from './parse'

const TEMPLATE = `Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

__QUEUED_ISSUES__
`

const NONE = '__(none)__'

export function updateBotComment(
  previousComment: string,
  amendments: Operation[]
): {updatedComment: string; errors: string[]} {
  const errors: string[] = []
  const issues: Map<string, QueuedIssue> = extractIssues(previousComment)
  console.debug('Issues extracted:', issues.size) // eslint-disable-line no-console

  for (const amendment of amendments) {
    switch (amendment.op) {
      case 'add':
        issues.set(generateHash(amendment.issue), amendment.issue)
        break
      case 'remove':
        if (!issues.delete(amendment.uid)) {
          errors.push(`Issue with uid '${amendment.uid}' not found!`)
        }
        break
    }
  }
  console.debug('Issues after amendments:', issues.size) // eslint-disable-line no-console

  let issuesOutput = NONE
  if (issues.size > 0) {
    issuesOutput = ''
    for (const [key, issue] of issues) {
      let labels = ''
      if (issue.labels.length > 0) {
        labels = ` [${issue.labels.join('][')}]`
      }

      issuesOutput += `  * ${key} - ${issue.repo} "${issue.title}"${labels}\n`
    }
  }

  return {
    updatedComment: TEMPLATE.replace('__QUEUED_ISSUES__', issuesOutput),
    errors
  }
}

function extractIssues(comment: string): Map<string, QueuedIssue> {
  const issues = new Map<string, QueuedIssue>()

  let match
  const regex = new RegExp(`\\*\\s+(.*)\\s+-\\s+(.*)$`, 'mg')
  while ((match = regex.exec(comment))) {
    console.log('Extracted:', match[0]) // eslint-disable-line no-console
    const issue = parseIssue(match[2])
    if (issue) {
      issues.set(match[1], issue)
    }
  }

  return issues
}

function generateHash(issue: QueuedIssue): string {
  let sha = hash.sha1().update(issue.repo).update(issue.title)

  for (const label of issue.labels) {
    sha = sha.update(label)
  }

  return sha.digest('hex').substring(0, 6)
}
