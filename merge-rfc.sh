#!/usr/bin/env zsh

set -euo pipefail

script="$0"
usage() {
  printf "Usage: %s [-i <issue>...] [-n] <PR#>\n" "$script"
  printf "Flags:\n"
  printf "  -i string\n\tgithub issue reference (example: buildpacks/spec#1)\n"
  printf "  -n\n\tno issues\n"
  exit 1
}

id() {
  ID=$(find text -depth 1 | sed -E 's|^text/([[:digit:]]{4})-.*$|\1|' | sort | tail -n 1)
  ((ID++))
  printf "%04d" "${ID}"
}

link_issue() {
  local issue="$1"
  link=$(echo "$issue" | sed -E 's|buildpacks/(.*)#([[:digit:]]+)|https://github.com/buildpacks/\1/issues/\2|')
  printf '[%s](%s)' "$issue" "$link"
}

issues="N/A"
no_issues=false
while getopts ":i:n" opt; do
  case ${opt} in
    i )
      if [[ $issues == "N/A" ]]; then
        issues=$(link_issue "$OPTARG")
      else
        issues+=", $(link_issue "$OPTARG")"
      fi
      ;;
    n )
      no_issues=true
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

if [[ $no_issues = false && $issues == "N/A" ]]; then
  echo -e "ERROR! No issues were provided. Are you sure there are no issues that should be linked?"
  echo -e "ERROR! Either -i or -n is required\n"
  usage
fi

shift $(($OPTIND - 1))
if [[ $# != 1 ]]; then
  usage
fi

git pull origin --rebase

PR="${1}"
ID=$(id)

echo "Merging PR ${PR} as rfc-${ID}"

git fetch origin "pull/${PR}/head:rfc-${ID}"
git merge "rfc-${ID}" --signoff --no-edit --no-ff
git branch -d "rfc-${ID}"

SOURCE=$(find text -depth 1 -name '0000-*')
TARGET=${SOURCE//0000/$(printf "%04d" "${ID}")}

sed -i '' "s|- RFC Pull Request: (leave blank)|- RFC Pull Request: [rfcs#${PR}](https://github.com/buildpacks/rfcs/pull/${PR})|" "${SOURCE}"
sed -i '' "s|- CNB Issue: (leave blank)|- CNB Issue: $issues|" "${SOURCE}"
git mv "${SOURCE}" "${TARGET}"
git add "${TARGET}"
git commit --signoff --message "RFC ${ID}

[#${PR}]
"
