#!/usr/bin/env zsh

set -eu

id() {
  ID=$(find text -depth 1 | sed -E 's|^text/([[:digit:]]{4})-.*$|\1|' | sort | tail -n 1)
  ((ID++))
  printf "%04d" "${ID}"
}

script="$0"
usage() {
  printf "Usage: %s [-i <issue>...] <PR#>\n" "${0:t}"
  exit 1
}

issues="N/A"
while getopts ":i:" opt; do
  case ${opt} in
    i )
      if [[ $issues == "N/A" ]]; then
        issues=$OPTARG
      else
        issues+=", $OPTARG"
      fi
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
