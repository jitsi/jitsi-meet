#!/bin/sh

if ! which git > /dev/null 2>&1 ;then
    echo "Cannot find git executable, not bumping js versions."
    exit
fi
if ! git status > /dev/null 2>&1 ;then
    echo "Not a git repository, not bumping js versions."
    exit
fi

# This script finds all js files included from index.html which have been
# modified and bumps their version (the value of the "v" parameter used
# in index.html)

# contents of index.html at HEAD (excluding not-committed changes)
index=`git show HEAD:index.html`

# js files included from index.html. The sort needed for comm
jsfiles=.bump-js-versions-jsfiles.tmp
echo "$index" | grep '<script src=".*"' -o | sed -e 's/<script src="//' | sed -e 's/\?.*//' |  tr -d \" | sort > $jsfiles

# modified files since the last commit
gitmodified=.bump-js-versions-gitmodified.tmp
git ls-files -m | sort > $gitmodified

for file in `comm -12 $jsfiles $gitmodified` ;do
    old_version=`echo "$index" | grep "<script src=\"${file}?v=[0-9]*" -o | sed -e 's/.*v=//'| tr -d \"`
    new_version=$((1+$old_version))
    echo Bumping version of $file from $old_version to $new_version
    sed -i.tmp -e "s%script src=\"${file}\?v=.*\"%script src=\"$file?v=$new_version\"%" index.html
done

rm -f $jsfiles $gitmodified index.html.tmp
