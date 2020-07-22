#!/usr/bin/env zsh

set -eu

id() {
  ID=$(find text -depth 1 | sed -E 's|^text/([[:digit:]]{4})-.*$|\1|' | sort | tail -n 1)
  ((ID++))
  printf "%04d" "${ID}"
}

if [[ $# != 1 ]]; then
  printf "Usage: %s <PR#>\n" "${0:t}"
  exit 1
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
git mv "${SOURCE}" "${TARGET}"
git add "${TARGET}"
git commit --signoff --message "RFC ${ID}

[#${PR}]
"
