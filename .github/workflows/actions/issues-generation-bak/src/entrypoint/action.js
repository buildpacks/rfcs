/*
 * This file is the entrypoint for GitHub Actions (see action.yml)
 */

const core = require('@actions/core');
const github = require('@actions/github');
const main = require('../main.js');

try {
  main(
    github.getOctokit(core.getInput("github-token", { required: true })),
    `${github.context.repo.owner}/${github.context.repo.repo}`,
  )
    .then(contents => {
      console.log("GENERATED CHANGELOG\n=========================\n", contents);
      core.setOutput("contents", contents)
    })
    .catch(error => core.setFailed(error.message))
} catch (error) {
  core.setFailed(error.message);
}