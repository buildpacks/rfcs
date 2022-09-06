#!/usr/bin/env bash

set -euo pipefail

script="$0"

####
# CONFIG
#

MAIN_BRANCH=${MAIN_BRANCH:-main}
OWNER=${OWNER:-buildpacks}
REPO=rfcs
BOT_USERNAME="buildpack-bot"

####
# FUNCTIONS
#

usage() {
  printf "Usage: %s [-i <issue>...] [-n] <PR_NUMBER#>\n" "$script"
  printf "Flags:\n"
  printf "  -i string\n\tgithub issue reference (example: ${OWNER}/${REPO}#1)\n"
  printf "  -n\n\tbe okay with no issues being created\n"
  exit 1
}

generate_id() {
  id="$(find text -maxdepth 1 -type f | sed -E 's|^text/([[:digit:]]{4})-.*$|\1|' | sort | tail -n 1 | sed 's/^0*//')"
  ((id++))
  printf "%04d" "${id}"
}

link_issue() {
  local issue="$1"
  link=$(echo "$issue" | sed -E "s|([^\/]+)/([^#]+)#([[:digit:]]+)$|https://github.com/\1/\2/issues/\3|")
  printf '[%s](%s)' "$issue" "$link"
}

require_command() {
    if ! [ -x "$(command -v ${1})" ]; then
        echo "Error: '${1}' is not installed." >&2
        exit 1
    fi
}

####
# DEPENDENCIES
#

require_command git
require_command jq
require_command issues-generation

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  require_command op
  echo "> Pulling GitHub token from vault..."
  GITHUB_TOKEN=$(op read op://Shared/7xorpxvz3je3vozqg3fy3wrcg4/credential --account buildpacks)
fi

####
# INPUTS / VALIDATION
#

NO_ISSUES=false
ISSUES_TEXT="N/A"

while getopts ":i:n" opt; do
  case ${opt} in
    i )
      if [[ $ISSUES_TEXT == "N/A" ]]; then
        ISSUES_TEXT=$(link_issue "$OPTARG")
      else
        ISSUES_TEXT+=", $(link_issue "$OPTARG")"
      fi
      ;;
    n )
      NO_ISSUES=true
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      usage
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      usage
      ;;
  esac
done

shift $(($OPTIND - 1))
if [[ $# != 1 ]]; then
  usage
fi
PR_NUMBER="${1}"

CURRENT_BRANCH=$(git branch --show-current)
if [[ "${CURRENT_BRANCH}" != "${MAIN_BRANCH}" ]]; then
  echo -e "ERROR! Expected current branch to be '${MAIN_BRANCH}', currently in '${CURRENT_BRANCH}'!";
  exit 1;
fi

####
# TASK
#

RFC_ID=$(generate_id)
echo "> Generated RFC number: ${RFC_ID}"

echo "> Creating issues for PR#${PR_NUMBER}"
export GITHUB_TOKEN

issues-generation create --pr "${OWNER}/${REPO}#${PR_NUMBER}" --bot $BOT_USERNAME  --prepend "[RFC #${RFC_ID}] "
ISSUES_TO_LINK=$(issues-generation list --pr "${OWNER}/${REPO}#${PR_NUMBER}" --bot $BOT_USERNAME --json | jq -r '[.[] | select(.num) | .repo + "#" + (.num|tostring) ] | join(" ")')

for ISSUE in ${ISSUES_TO_LINK}; do
  if [[ $ISSUES_TEXT == "N/A" ]]; then
    ISSUES_TEXT=$(link_issue "$ISSUE")
  else
    ISSUES_TEXT+=", $(link_issue "$ISSUE")"
  fi
done


if [[ $NO_ISSUES = false && $ISSUES_TEXT == "N/A" ]]; then
  echo -e "ERROR! No issues were provided. Are you sure there are no issues that should be linked?"
  echo -e "ERROR! Either -i or -n is required\n"
  usage
fi

echo "> Pulling latest changes...."
git pull origin --rebase

echo "> Merging PR#${PR_NUMBER} as rfc-${RFC_ID}"
git fetch origin "pull/${PR_NUMBER}/head:rfc-${RFC_ID}"
git merge "rfc-${RFC_ID}" --signoff --no-edit --no-ff
git branch -d "rfc-${RFC_ID}"

SOURCE_DOC=$(find text -maxdepth 1 -name '0000-*')
TARGET_DOC=${SOURCE_DOC//0000/${RFC_ID}}

echo "> Updating document: ${SOURCE_DOC}"
SEDOPTION="-i"
if [[ "$OSTYPE" == "darwin"* ]]; then
  SEDOPTION="-i ''"
fi
sed $SEDOPTION "s|- RFC Pull Request:.*|- RFC Pull Request: [${REPO}#${PR_NUMBER}](https://github.com/${OWNER}/${REPO}/pull/${PR_NUMBER})|" "${SOURCE_DOC}"
sed $SEDOPTION "s|- CNB Issue:.*|- CNB Issue: $ISSUES_TEXT|" "${SOURCE_DOC}"
sed $SEDOPTION "s|- Status:.*|- Status: Approved|" "${SOURCE_DOC}"

echo "> Moving ${SOURCE_DOC} to ${TARGET_DOC}..."
git mv "${SOURCE_DOC}" "${TARGET_DOC}"
git add "${TARGET_DOC}"

echo "> Committing..."
git commit --signoff --message "RFC ${RFC_ID}

[#${PR_NUMBER}]
"
