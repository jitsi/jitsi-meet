#!/bin/bash
set -e

echo 'Updating and installing the necessary packages'
sudo apt-get update
sudo apt-get install debhelper nodejs

echo 'Packaging the repository into a debian package'
mkdir -p artifacts/
dpkg-buildpackage -A -rfakeroot -us -uc -tc
cp ./../*.deb artifacts
cp ./../*.buildinfo artifacts
cp ./../*.changes artifacts

echo 'List of generated build files'
ls artifacts