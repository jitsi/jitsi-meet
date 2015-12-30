BROWSERIFY = ./node_modules/.bin/browserify
UGLIFYJS = ./node_modules/.bin/uglifyjs
EXORCIST = ./node_modules/.bin/exorcist
GLOBAL_FLAGS =
OUTPUT_DIR = .
DEPLOY_DIR = ../../jitsi-meet

all: compile uglify deploy

compile:FLAGS = $(GLOBAL_FLAGS)
compile: app

debug: compile-debug source-maps uglify-debug deploy

compile-debug:FLAGS = -d $(GLOBAL_FLAGS)
compile-debug: app

app:
	$(BROWSERIFY) $(FLAGS) JitsiMeetJS.js -s JitsiMeetJS -o $(OUTPUT_DIR)/lib-jitsi-meet.js

source-maps:
	cat $(OUTPUT_DIR)/lib-jitsi-meet.js | $(EXORCIST) $(OUTPUT_DIR)/lib-jitsi-meet.js.map

uglify:SOURCE_MAPS=
uglify:
	$(UGLIFYJS) -p relative $(OUTPUT_DIR)/lib-jitsi-meet.js -o $(OUTPUT_DIR)/lib-jitsi-meet.min.js $(SOURCE_MAPS)

uglify-debug:SOURCE_MAPS=--source-map $(OUTPUT_DIR)/lib-jitsi-meet.min.map --in-source-map $(OUTPUT_DIR)/lib-jitsi-meet.js.map
uglify-debug: uglify

clean:
	rm -f $(OUTPUT_DIR)/lib-jitsi-meet.js

deploy:
	mkdir -p $(DEPLOY_DIR) && \
	cp $(OUTPUT_DIR)/lib-jitsi-meet.js $(DEPLOY_DIR) && \
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)
