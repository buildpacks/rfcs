import hash from "hash.js";
import { QueuedIssue, REGEX_ISSUE, parseLabels, Operation } from "./parse"

const TEMPLATE = `Maintainers,

As you review this RFC please queue up issues to be created using the following commands:

/queue-issue <repo> "<title>" [labels]...
/unqueue-issue <uid>

### Queued Issues

__QUEUED_ISSUES__
`

const NONE = '__(none)__'

export function updateComment(previousComment: string, amendments: Array<Operation>): string {
    let issues: Array<QueuedIssue> = extractIssues(previousComment);
    console.debug("Issues extracted:", issues.length);

    amendments.forEach(amendment => {
        if (amendment.op == "add") {
            issues.push(amendment.issue);
        }
    });
    console.debug("Issues after amendments:", issues.length);

    var issuesOutput = NONE;
    if (issues.length > 0) {
        issuesOutput = "";
        issues.forEach(issue => {
            var labels = "";
            if (issue.labels.length > 0) {
                labels = ` [${issue.labels.join("][")}]`
            }

            issuesOutput += `  * ${generateHash(issue)} - ${issue.repo} "${issue.title}"${labels}\n`;
        });
    }

    return TEMPLATE.replace("__QUEUED_ISSUES__", issuesOutput)
}

function extractIssues(comment: string): Array<QueuedIssue> {
    let issues: Array<QueuedIssue> = [];

    var match
    let regex = new RegExp(`\\*\\s+.*\\s+${REGEX_ISSUE}$`, "mg");
    while (match = regex.exec(comment)) {
        console.log("Extracted:", match[0])
        issues.push({
            repo: match[1],
            title: match[3] || match[4],
            labels: parseLabels(match[5])
        })
    }

    return issues
}

function generateHash(issue: QueuedIssue): string {
    let sha = hash.sha1().update(issue.repo).update(issue.title)

    issue.labels.forEach(label => {
        sha = sha.update(label)
    })

    return sha.digest('hex').substring(0, 6)
}