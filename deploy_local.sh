#!/bin/sh
SRC_DIR="/home/intulseadmin/intulse-jitsi-meet" # full path, no trailing slash
DST_DIR="/usr/share/jitsi-meet"         # full path, no trailing slash

# rm -r $DST_DIR
# mkdir $DST_DIR

cp "${SRC_DIR}/base.html" "${DST_DIR}/base.html"
cp "${SRC_DIR}/body.html" "${DST_DIR}/body.html"

#mkdir "${DST_DIR}/connection_optimization/"
cp -r "${SRC_DIR}/connection_optimization/." "${DST_DIR}/connection_optimization/"

#mkdir "${DST_DIR}/css/"
cp "${SRC_DIR}/css/all.css" "${DST_DIR}/css/all.css"

cp "${SRC_DIR}/favicon.ico" "${DST_DIR}/favicon.ico"

#mkdir "${DST_DIR}/fonts/"
cp -r "${SRC_DIR}/fonts/." "${DST_DIR}/fonts/"

cp "${SRC_DIR}/head.html" "${DST_DIR}/head.html"

3mkdir "${DST_DIR}/images/"
cp -r "${SRC_DIR}/images/." "${DST_DIR}/images/"

cp "${SRC_DIR}/index.html" "${DST_DIR}/index.html"
cp "${SRC_DIR}/interface_config.js" "${DST_DIR}/interface_config.js"

#mkdir "${DST_DIR}/lang/"
cp -r "${SRC_DIR}/lang/." "${DST_DIR}/lang/"

#mkdir "${DST_DIR}/libs/"
cp -r "${SRC_DIR}/libs/." "${DST_DIR}/libs/"

cp "${SRC_DIR}/logging_config.js" "${DST_DIR}/logging_config.js"

cp "${SRC_DIR}/package-lock.json" "${DST_DIR}/package-lock.json"
cp "${SRC_DIR}/package.json" "${DST_DIR}/package.json"
cp "${SRC_DIR}/phoneNumberList.json" "${DST_DIR}/phoneNumberList.json"
cp "${SRC_DIR}/plugin.head.html" "${DST_DIR}/plugin.head.html"

#mkdir "${DST_DIR}/sounds/"
cp -r "${SRC_DIR}/sounds/." "${DST_DIR}/sounds/"

#mkdir "${DST_DIR}/static/"
cp -r "${SRC_DIR}/static/." "${DST_DIR}/static/"

cp "${SRC_DIR}/title.html" "${DST_DIR}/title.html"

echo "Publish Done!"
