BUILD_DIR=DEPLOY_FOLDER
mkdir ${BUILD_DIR}
mkdir ${BUILD_DIR}/prosody-plugins
mkdir ${BUILD_DIR}/static
mkdir ${BUILD_DIR}/sounds
mkdir ${BUILD_DIR}/images
mkdir ${BUILD_DIR}/fonts
mkdir ${BUILD_DIR}/lang
mkdir ${BUILD_DIR}/libs
mkdir ${BUILD_DIR}/css

cp -R resources/prosody-plugins/* ${BUILD_DIR}/prosody-plugins
cp -f resources/robots.txt ${BUILD_DIR}
cp interface_config.js ${BUILD_DIR}
cp -R static/* ${BUILD_DIR}/static
cp -R sounds/* ${BUILD_DIR}/sounds
cp -R images/* ${BUILD_DIR}/images
cp css/*.css.map ${BUILD_DIR}/css/
cp -f css/*.css ${BUILD_DIR}/css/
cp -f manifest.json ${BUILD_DIR}
cp -R fonts/* ${BUILD_DIR}/fonts
cp -R libs/* ${BUILD_DIR}/libs
cp -R lang/* ${BUILD_DIR}/lang
cp -f favicon.ico ${BUILD_DIR}
cp -f config.js ${BUILD_DIR}
cp -f *.html ${BUILD_DIR}