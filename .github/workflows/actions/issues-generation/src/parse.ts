

export type Add = {
    repo: string
    title: string
    labels: Array<string>
}

export type Remove = {
    uid: string
}

export function parse(contents: string): { actions: Array<Add | Remove>, errors: Array<string> } {
    let actions = new Array<Add | Remove>();
    let errors = new Array<string>();

    parseAdditions(contents).forEach(a => actions.push(a))

    return { actions, errors }
}

function parseAdditions(contents: string) {
    let issues = new Array<Add>();

    var match
    let regex = /^\/queue-issue\s+([^\s]+)\s+("([^\"]+)"|'([^\']+)')(.*)/mg
    while (match = regex.exec(contents)) {
        console.log("Adding:", match[0])
        issues.push({
            repo: match[1],
            title: match[3] || match[4],
            labels: parseLabels(match[5])
        })
    }

    return issues
}

function parseLabels(contents: string): Array<string> {
    let labels = new Array<string>();

    var match
    let regex = /(\[([^\]]+)\])/g
    while (match = regex.exec(contents)) {
        labels.push(match[2])
    }

    return labels
}