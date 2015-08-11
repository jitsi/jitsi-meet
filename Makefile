NPM = npm
BROWSERIFY = browserify
GLOBAL_FLAGS = -x jquery -e
OUTPUT_DIR = .
DEPLOY_DIR = libs

all: compile deploy clean

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
