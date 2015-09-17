NPM = npm
BROWSERIFY = ./node_modules/.bin/browserify
UGLIFYJS = ./node_modules/.bin/uglifyjs
EXORCIST = ./node_modules/.bin/exorcist
DEPLOY_DIR = libs
BROWSERIFY_FLAGS = -d -x jquery 
OUTPUT_DIR = .

all: compile uglify deploy clean 

compile:
	$(NPM) update && $(BROWSERIFY) $(BROWSERIFY_FLAGS) -e app.js -s APP | $(EXORCIST) $(OUTPUT_DIR)/app.bundle.js.map > $(OUTPUT_DIR)/app.bundle.js

clean:
	rm -f $(OUTPUT_DIR)/app.bundle.*

deploy:
	mkdir -p $(DEPLOY_DIR) && \
	cp $(OUTPUT_DIR)/app.bundle.min.js $(OUTPUT_DIR)/app.bundle.min.map $(DEPLOY_DIR) && \
	./bump-js-versions.sh && \
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

uglify:
	$(UGLIFYJS) -p relative $(OUTPUT_DIR)/app.bundle.js -o $(OUTPUT_DIR)/app.bundle.min.js --source-map $(OUTPUT_DIR)/app.bundle.min.map --in-source-map $(OUTPUT_DIR)/app.bundle.js.map

source-package:
	mkdir -p source_package/jitsi-meet && \
	cp -r analytics.js app.js css external_api.js favicon.ico fonts images index.html interface_config.js libs plugin.*html sounds title.html unsupported_browser.html LICENSE config.js lang source_package/jitsi-meet && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
