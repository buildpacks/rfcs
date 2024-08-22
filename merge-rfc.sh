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

if [[ $NO_ISSUES = false && $ISSUES_TEXT == "N/A" ]]; then
  echo "> Please create an issue by following the link below:"
  echo "https://github.com/buildpacks/rfcs/issues/new?assignees=&labels=type%2Ftracking&projects=&template=tracking.md&title=%5BRFC+%23${RFC_ID}%5D+%3C+-+INSERT+RFC+TITLE%3E"
  echo ""
  read -p "Press Enter to continue" </dev/tty

  read -p "> Please enter the issue link: " ISSUES_TEXT
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
