NPM = npm
NODE_BIN_PATH = node_modules/.bin
BROWSERIFY = $(NODE_BIN_PATH)/browserify
COFFEELINT = $(NODE_BIN_PATH)/coffeelint
KARMA = $(NODE_BIN_PATH)/karma
GLOBAL_FLAGS = -x jquery -e
OUTPUT_DIR = .
DEPLOY_DIR = libs

.PHONY: all compile debug compile-debug app clean deploy test

all: compile deploy test clean

compile:FLAGS = $(GLOBAL_FLAGS)
compile: app

debug: compile-debug deploy clean

compile-debug:FLAGS = -d $(GLOBAL_FLAGS)
compile-debug: app

app:
	$(NPM) update && $(BROWSERIFY) $(FLAGS) app.js -s APP -o $(OUTPUT_DIR)/app.bundle.js

clean:
	@rm -f $(OUTPUT_DIR)/*.bundle.js

deploy:
	@mkdir -p $(DEPLOY_DIR) && cp $(OUTPUT_DIR)/*.bundle.js $(DEPLOY_DIR) && ./bump-js-versions.sh

coffeelint:
	$(COFFEELINT) *.coffee test/spec/*.coffee

test: coffeelint
	$(KARMA) start karma.conf.coffee