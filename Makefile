BROWSERIFY = browserify
GLOBAL_FLAGS = -e
MODULE_DIR = modules
MODULE_SUBDIRS = $(wildcard $(MODULE_DIR)/*/)
MODULES = $(MODULE_SUBDIRS:$(MODULE_DIR)/%/=%)
OUTPUT_DIR = .
DEPLOY_DIR = libs/modules

all:FLAGS = $(GLOBAL_FLAGS)
all:$(MODULES)

debug:FLAGS = -d $(GLOBAL_FLAGS)
debug:$(MODULES)

$(MODULES): *.js
	$(BROWSERIFY) $(FLAGS) $(MODULE_DIR)/$@/$@.js -s $@ -o $(OUTPUT_DIR)/$@.bundle.js

clean:
	@rm -f $(OUTPUT_DIR)/*.bundle.js

deploy:
	@mkdir -p $(DEPLOY_DIR) && cp $(OUTPUT_DIR)/*.bundle.js $(DEPLOY_DIR)
