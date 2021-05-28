/*
 * This file is the entrypoint for local development and manual testing.
 */

const path = require('path');
const main = require(path.resolve('main.js'));

const {Octokit} = require("@octokit/rest");
const github = new Octokit({auth: mustGetEnvVar('GITHUB_TOKEN')});

main(
  github,
  "buildpacks/pack",
  mustGetArg(0, "milestone"),
  mustGetArg(1, "config-path")
)
  .then(console.log)
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function mustGetArg(position, name) {
  let value = process.argv[position + 2];
  if (!value) {
    console.error(`'${name}' must be provided as argument ${position}.`);
    process.exit(1);
  }
  return value;
}

function mustGetEnvVar(envVar) {
  let value = process.env[envVar];
  if (!value) {
    console.error(`'${envVar}' env var must be set.`);
    process.exit(1);
  }
  return value;
}