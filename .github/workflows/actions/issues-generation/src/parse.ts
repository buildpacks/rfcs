export const REGEX_ISSUE = `([^\\s]+)\\s+("([^\\"]+)"|'([^\\']+)')(.*)`

export interface QueuedIssue {
  repo: string
  title: string
  labels: string[]
}

export interface Add {
  op: 'add'
  issue: QueuedIssue
}

export interface Remove {
  op: 'remove'
  uid: string
}

export type Operation = Add | Remove

/**
 * Extract Operations found in any content
 *
 * @param contents
 * @returns array of operations extracted
 */
export function parseUserComment(contents: string): Operation[] {
  const actions: Operation[] = []

  for (const addition of extractAdditions(contents)) {
    actions.push(addition)
  }

  for (const removals of parseRemovals(contents)) {
    actions.push(removals)
  }

  return actions
}

/**
 * parse an individual issue
 *
 * @returns QueuedIssue or undefined when not a match
 */
export function parseIssue(str: string): QueuedIssue | undefined {
  const match = new RegExp(REGEX_ISSUE).exec(str)
  if (match && match.length >= 6) {
    return {
      repo: match[1],
      title: match[3] || match[4],
      labels: extractLabels(match[5])
    }
  }

  return
}

/**
 * Extract additions from any content
 *
 * @param contents
 * @returns array of additions
 */
function extractAdditions(contents: string): Add[] {
  const issues: Add[] = []

  let match
  const regex = new RegExp(`^/queue-issue\\s+(.*)$`, 'mg')
  while ((match = regex.exec(contents))) {
    const issue = parseIssue(match[1])
    if (issue) {
      console.log('Adding:', match[0]) // eslint-disable-line no-console
      issues.push({op: 'add', issue})
    }
  }

  return issues
}

/**
 * Extract labels from any content
 *
 * @param contents
 * @returns array of labels
 */
export function extractLabels(contents: string): string[] {
  const labels: string[] = []

  let match
  const regex = /(\[([^\]]+)\])/g
  while ((match = regex.exec(contents))) {
    labels.push(match[2])
  }

  return labels
}

/**
 * Extract removals from any content
 *
 * @param contents
 * @returns array of removals found
 */
function parseRemovals(contents: string): Remove[] {
  const issues: Remove[] = []

  let match
  const regex = /^\/unqueue-issue\s+(\w+)/gm
  while ((match = regex.exec(contents))) {
    console.log('Removing:', match[0]) // eslint-disable-line no-console
    issues.push({
      op: 'remove',
      uid: match[1]
    })
  }

  return issues
}
