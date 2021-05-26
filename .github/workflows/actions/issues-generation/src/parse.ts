export const REGEX_ISSUE = `([^\\s]+)\\s+("([^\\"]+)"|'([^\\']+)')(.*)`

export interface QueuedIssue {
    repo: string
    title: string
    labels: Array<string>
}

export interface Add {
    op: "add"
    issue: QueuedIssue
}

export interface Remove {
    op: "remove"
    uid: string
}

export type Operation = Add | Remove


export function parse(contents: string): Array<Operation> {
    let actions = new Array<Operation>();

    parseAdditions(contents).forEach(a => actions.push(a))
    parseRemovals(contents).forEach(a => actions.push(a))

    return actions
}

function parseRemovals(contents: string) {
    let issues = new Array<Remove>();

    var match
    let regex = /^\/unqueue-issue\s+(\w+)/mg
    while (match = regex.exec(contents)) {
        console.log("Removing:", match[0])
        issues.push({
            op: "remove",
            uid: match[1]
        })
    }

    return issues
}

function parseAdditions(contents: string) {
    let issues = new Array<Add>();

    var match
    let regex = new RegExp(`^/queue-issue\\s+${REGEX_ISSUE}$`, "mg");
    while (match = regex.exec(contents)) {
        console.log("Adding:", match[0])
        issues.push({
            op: "add",
            issue: {
                repo: match[1],
                title: match[3] || match[4],
                labels: parseLabels(match[5])
            }
        })
    }

    return issues
}

export function parseLabels(contents: string): Array<string> {
    let labels = new Array<string>();

    var match
    let regex = /(\[([^\]]+)\])/g
    while (match = regex.exec(contents)) {
        labels.push(match[2])
    }

    return labels
}