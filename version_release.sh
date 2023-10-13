#!/bin/sh

branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
masterBranch=$branch
currentVersion=`node -p "require('./package.json').webAppVersion"`


if [ $branch == "master" ]; then
  echo "Jitsi Release Script"
  echo "The current release version is $currentVersion \n"

  echo "Enter the release notes url"
  read releaseNotesUrl
  echo ""

  v=( ${currentVersion//./ } )  # replace points, split version number into array

  echo "What type of release is this?"
  PS3='Please choose a type: '
  releaseTypes=("Feature" "Patch")
  select type in "${releaseTypes[@]}"; do
    case $type in
      "Feature")
        echo "This is a Feature Release, updating Minor number \n"
        ((v[2]++))
        ((v[3] = 0))
        break
        ;;
      "Patch")
        echo "This is a BugFix/Patch Release, updating Patch number \n"
        ((v[3]++))
        break
        ;;
        *) echo "invalid option $REPLY";;
      esac
  done

  # versionNumber rebuilds CalVer, eg v23.1.0.1, etc
  year=$(date +%y) # 23, 24, 25 etc
  month=$(date +%m) # 01, 02 ... 11, 12 etc

  # if the current year and month are not the same as the previous version number, reset the patch and feature numbers
  # since we are in a new month or year
  if [ "$year$month" != "${v[0]}${v[1]}" ]; then
    if [ "$type" == "Feature" ]; then
      v[2]=1
      v[3]=0
    else # Patch
      v[2]=0
      v[3]=1
    fi
  fi

  versionNumber="$year.$month.${v[2]}.${v[3]}"

  echo "Is the version number correct? $versionNumber y/n"
  read isCorrectVersion

  if [ $isCorrectVersion == "y" ]; then
    # establish branch and tag name variables
    releaseBranch=release-$versionNumber
    tagName=$versionNumber

    echo "Creating release branch for $versionNumber"
    git checkout -b $releaseBranch

    echo "Incrementing version number"
    sed -i '' "s/${currentVersion}/${versionNumber}/" package.json

    echo "Creating release commit and tag"
    git add package.json
    git commit --allow-empty -m "Release $versionNumber" -m "$releaseNotesUrl"

    git tag $tagName
    git push origin $tagName

    echo "Pushing release branch to remote origin"
    git push --set-upstream origin $releaseBranch
  else
    echo "Please manually enter correct release version"
    read customReleaseVersion
    echo "Is the version number correct? v$customReleaseVersion y/n"
    read confirmCustomVersion
    if [ $confirmCustomVersion == "y" ]; then
          # establish branch and tag name variables
        versionNumber=$customReleaseVersion
        releaseBranch=release-$versionNumber
        tagName=$versionNumber

        echo "Creating release branch for $versionNumber"
        git checkout -b $releaseBranch

        echo "Incrementing version number"
        sed -i '' "s/${currentVersion}/${versionNumber}/" package.json

        echo "Creating release commit and tag"
        git add package.json
        git commit --allow-empty -m "Release $versionNumber" -m "$releaseNotesUrl"

        git tag $tagName
        git push origin $tagName

        echo "Pushing release branch to remote origin"
        git push --set-upstream origin $releaseBranch
    else
      echo "Please begin release script again. No changes have been made."
    fi
  fi
else
  echo "Please make sure you are on main branch!"
fi
