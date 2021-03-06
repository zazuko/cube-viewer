#!/bin/sh

set -euo pipefail

if [ -z "$(git status --untracked-files=no --porcelain)" ]; then
    echo 'Starting deployment...\n'
else
    echo 'Repository is not clean. Aborting.\n'
    exit 1
fi

git checkout --orphan gh-pages
npm run build
echo "cube-viewer.zazuko.com" > dist/CNAME
git --work-tree dist add --all
git --work-tree dist commit -m 'Deploy'
git push origin HEAD:gh-pages --force
rm -r dist
git checkout -f main
git branch -D gh-pages
