NPM = npm
BROWSERIFY = ./node_modules/.bin/browserify
UGLIFYJS = ./node_modules/.bin/uglifyjs
EXORCIST = ./node_modules/.bin/exorcist
CLEANCSS = ./node_modules/.bin/cleancss
CSS_FILES = font.css toastr.css main.css videolayout_default.css font-awesome.css jquery-impromptu.css modaldialog.css notice.css popup_menu.css login_menu.css popover.css jitsi_popover.css contact_list.css chat.css welcome_page.css settingsmenu.css
DEPLOY_DIR = libs
BROWSERIFY_FLAGS = -d
OUTPUT_DIR = .

all: compile uglify deploy clean 

compile:
	$(NPM) update && $(BROWSERIFY) $(BROWSERIFY_FLAGS) -e app.js -s APP | $(EXORCIST) $(OUTPUT_DIR)/app.bundle.js.map > $(OUTPUT_DIR)/app.bundle.js

clean:
	rm -f $(OUTPUT_DIR)/app.bundle.*

deploy:
	mkdir -p $(DEPLOY_DIR) && \
	cp $(OUTPUT_DIR)/app.bundle.min.js $(OUTPUT_DIR)/app.bundle.min.map $(DEPLOY_DIR) && \
	(cd css; cat $(CSS_FILES)) | $(CLEANCSS) > css/all.css && \
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

uglify:
	$(UGLIFYJS) -p relative $(OUTPUT_DIR)/app.bundle.js -o $(OUTPUT_DIR)/app.bundle.min.js --source-map $(OUTPUT_DIR)/app.bundle.min.map --in-source-map $(OUTPUT_DIR)/app.bundle.js.map


source-package:
	mkdir -p source_package/jitsi-meet/css && \
	cp -r analytics.js external_api.js favicon.ico fonts images index.html interface_config.js libs plugin.*html sounds title.html unsupported_browser.html LICENSE config.js lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
