NPM = npm
BROWSERIFY = ./node_modules/.bin/browserify
NODE_SASS = ./node_modules/.bin/node-sass
UGLIFYJS = ./node_modules/.bin/uglifyjs
EXORCIST = ./node_modules/.bin/exorcist
CLEANCSS = ./node_modules/.bin/cleancss
STYLES_MAIN = css/main.scss
STYLES_BUNDLE = css/all.bundle.css
STYLES_DESTINATION = css/all.css
DEPLOY_DIR = libs
BROWSERIFY_FLAGS = -d
OUTPUT_DIR = .
LIBJITSIMEET_DIR = node_modules/lib-jitsi-meet/
IFRAME_API_DIR = ./modules/API/external

all: update-deps compile compile-iframe-api uglify uglify-iframe-api deploy clean

update-deps:
	$(NPM) update

compile:
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -e app.js -s APP | $(EXORCIST) $(OUTPUT_DIR)/app.bundle.js.map > $(OUTPUT_DIR)/app.bundle.js

compile-iframe-api:
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -e $(IFRAME_API_DIR)/external_api.js -s JitsiMeetExternalAPI | $(EXORCIST) $(OUTPUT_DIR)/external_api.js.map > $(OUTPUT_DIR)/external_api.js

clean:
	rm -f $(OUTPUT_DIR)/app.bundle.* $(OUTPUT_DIR)/external_api.*

deploy: deploy-init deploy-appbundle deploy-lib-jitsi-meet deploy-css deploy-local

deploy-init:
	mkdir -p $(DEPLOY_DIR)

deploy-appbundle:
	cp $(OUTPUT_DIR)/app.bundle.min.js $(OUTPUT_DIR)/app.bundle.min.map \
	$(OUTPUT_DIR)/app.bundle.js $(OUTPUT_DIR)/app.bundle.js.map \
	$(OUTPUT_DIR)/external_api.js.map $(OUTPUT_DIR)/external_api.js \
	$(OUTPUT_DIR)/external_api.min.map $(OUTPUT_DIR)/external_api.min.js \
	$(OUTPUT_DIR)/analytics.js \
	$(DEPLOY_DIR)

deploy-lib-jitsi-meet:
	cp $(LIBJITSIMEET_DIR)/lib-jitsi-meet.min.js \
	$(LIBJITSIMEET_DIR)/lib-jitsi-meet.min.map \
	$(LIBJITSIMEET_DIR)/lib-jitsi-meet.js \
	$(LIBJITSIMEET_DIR)/lib-jitsi-meet.js.map \
	$(LIBJITSIMEET_DIR)/connection_optimization/external_connect.js \
	$(DEPLOY_DIR)
deploy-css:
	$(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
	$(CLEANCSS) $(STYLES_BUNDLE) > $(STYLES_DESTINATION) ; \
	rm $(STYLES_BUNDLE)

deploy-local:
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

uglify:
	$(UGLIFYJS) -p relative $(OUTPUT_DIR)/app.bundle.js -o $(OUTPUT_DIR)/app.bundle.min.js --source-map $(OUTPUT_DIR)/app.bundle.min.map --in-source-map $(OUTPUT_DIR)/app.bundle.js.map

uglify-iframe-api:
	$(UGLIFYJS) -p relative $(OUTPUT_DIR)/external_api.js -o $(OUTPUT_DIR)/external_api.min.js --source-map $(OUTPUT_DIR)/external_api.min.map --in-source-map $(OUTPUT_DIR)/external_api.js.map


source-package:
	mkdir -p source_package/jitsi-meet/css && \
	cp -r *.js *.html connection_optimization favicon.ico fonts images libs sounds LICENSE lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	cp css/unsupported_browser.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
