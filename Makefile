BUILD_DIR = build
CLEANCSS = ./node_modules/.bin/cleancss
DEPLOY_DIR = libs
LIBJITSIMEET_DIR = node_modules/lib-jitsi-meet/
NODE_SASS = ./node_modules/.bin/node-sass
NPM = npm
OUTPUT_DIR = .
STYLES_BUNDLE = css/all.bundle.css
STYLES_DESTINATION = css/all.css
STYLES_MAIN = css/main.scss
WEBPACK = ./node_modules/.bin/webpack

all: compile deploy clean

compile:
	$(WEBPACK) -p

clean:
	rm -fr $(BUILD_DIR)

deploy: deploy-init deploy-appbundle deploy-lib-jitsi-meet deploy-css deploy-local

deploy-init:
	mkdir -p $(DEPLOY_DIR)

deploy-appbundle:
	cp \
		$(BUILD_DIR)/app.bundle.min.js \
		$(BUILD_DIR)/app.bundle.min.map \
		$(BUILD_DIR)/do_external_connect.min.js \
		$(BUILD_DIR)/do_external_connect.min.map \
		$(BUILD_DIR)/external_api.min.js \
		$(BUILD_DIR)/external_api.min.map \
		$(BUILD_DIR)/device_selection_popup_bundle.min.js \
		$(BUILD_DIR)/device_selection_popup_bundle.min.map \
		$(OUTPUT_DIR)/analytics.js \
		$(DEPLOY_DIR)

deploy-lib-jitsi-meet:
	cp \
		$(LIBJITSIMEET_DIR)/lib-jitsi-meet.min.js \
		$(LIBJITSIMEET_DIR)/lib-jitsi-meet.min.map \
		$(LIBJITSIMEET_DIR)/connection_optimization/external_connect.js \
		$(DEPLOY_DIR)

deploy-css:
	$(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
	$(CLEANCSS) $(STYLES_BUNDLE) > $(STYLES_DESTINATION) ; \
	rm $(STYLES_BUNDLE)

deploy-local:
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

source-package:
	mkdir -p source_package/jitsi-meet/css && \
	cp -r *.js *.html connection_optimization favicon.ico fonts images libs static sounds LICENSE lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
