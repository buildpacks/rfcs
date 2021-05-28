import * as core from '@actions/core'
import * as github from '@actions/github'

try {
  core.debug(`COMMENT: ${JSON.stringify(github.context.payload.comment)}`);
} catch (error) {
  core.setFailed(error.message)
}

// function isCI(): boolean {
//   return process.env['CI'] === 'true'
// }
