BROWSERIFY = browserify
DEPLOY_DIR = libs
GLOBAL_FLAGS = -x jquery -e
NPM = npm
OUTPUT_DIR = .
UGLIFYJS = uglifyjs

all: compile deploy clean uglify

compile:FLAGS = $(GLOBAL_FLAGS)
compile: app

debug: compile-debug deploy clean

compile-debug:FLAGS = -d $(GLOBAL_FLAGS)
compile-debug: app

app:
	$(NPM) update && $(BROWSERIFY) $(FLAGS) app.js -s APP -o $(OUTPUT_DIR)/app.bundle.js

clean:
	rm -f $(OUTPUT_DIR)/*.bundle.js

deploy:
	mkdir -p $(DEPLOY_DIR) && \
	cp $(OUTPUT_DIR)/*.bundle.js $(DEPLOY_DIR) && \
	./bump-js-versions.sh && \
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

uglify:
	$(UGLIFYJS) -p relative libs/app.bundle.js -o libs/app.bundle.min.js --source-map libs/app.bundle.js.map --source-map-url=app.bundle.js.map

source-package:
	mkdir -p source_package/jitsi-meet && \
	cp -r analytics.js app.js css external_api.js favicon.ico fonts images index.html interface_config.js libs plugin.*html sounds title.html unsupported_browser.html LICENSE config.js lang source_package/jitsi-meet && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
