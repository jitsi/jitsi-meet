BROWSERIFY = browserify
GLOBAL_FLAGS =
OUTPUT_DIR = .
DEPLOY_DIR = ../../jitsi-meet

all: compile deploy

compile:FLAGS = $(GLOBAL_FLAGS)
compile: app

debug: compile-debug deploy

compile-debug:FLAGS = -d $(GLOBAL_FLAGS)
compile-debug: app

app:
	$(BROWSERIFY) $(FLAGS) JitsiMeetJS.js -s JitsiMeetJS -o $(OUTPUT_DIR)/lib-jitsi-meet.js

clean:
	rm -f $(OUTPUT_DIR)/lib-jitsi-meet.js

deploy:
	mkdir -p $(DEPLOY_DIR) && \
	cp $(OUTPUT_DIR)/lib-jitsi-meet.js $(DEPLOY_DIR) && \
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)
