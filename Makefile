BUILD_DIR = build
CLEANCSS = ./node_modules/.bin/cleancss
DEPLOY_DIR = libs
LIBJITSIMEET_DIR = node_modules/lib-jitsi-meet
LIBFLAC_DIR = node_modules/libflacjs/dist/min
OLM_DIR = node_modules/@matrix-org/olm
TF_WASM_DIR = node_modules/@tensorflow/tfjs-backend-wasm/dist/
RNNOISE_WASM_DIR = node_modules/rnnoise-wasm/dist
TFLITE_WASM = react/features/stream-effects/virtual-background/vendor/tflite
MEET_MODELS_DIR  = react/features/stream-effects/virtual-background/vendor/models
FACIAL_MODELS_DIR = react/features/facial-recognition/resources
NODE_SASS = ./node_modules/.bin/sass
NPM = npm
OUTPUT_DIR = .
STYLES_BUNDLE = css/all.bundle.css
STYLES_DESTINATION = css/all.css
STYLES_MAIN = css/main.scss
WEBPACK = ./node_modules/.bin/webpack
WEBPACK_DEV_SERVER = ./node_modules/.bin/webpack serve --mode development

all: compile deploy clean

compile: compile-load-test
	$(WEBPACK)

compile-load-test:
	${NPM} install --prefix resources/load-test && ${NPM} run build --prefix resources/load-test

clean:
	rm -fr $(BUILD_DIR)

.NOTPARALLEL:
deploy: deploy-init deploy-appbundle deploy-rnnoise-binary deploy-tflite deploy-meet-models deploy-lib-jitsi-meet deploy-libflac deploy-olm deploy-tf-wasm deploy-css deploy-local deploy-facial-expressions

deploy-init:
	rm -fr $(DEPLOY_DIR)
	mkdir -p $(DEPLOY_DIR)

deploy-appbundle:
	cp \
		$(BUILD_DIR)/app.bundle.min.js \
		$(BUILD_DIR)/app.bundle.min.js.map \
		$(BUILD_DIR)/do_external_connect.min.js \
		$(BUILD_DIR)/do_external_connect.min.js.map \
		$(BUILD_DIR)/external_api.min.js \
		$(BUILD_DIR)/external_api.min.js.map \
		$(BUILD_DIR)/flacEncodeWorker.min.js \
		$(BUILD_DIR)/flacEncodeWorker.min.js.map \
		$(BUILD_DIR)/dial_in_info_bundle.min.js \
		$(BUILD_DIR)/dial_in_info_bundle.min.js.map \
		$(BUILD_DIR)/alwaysontop.min.js \
		$(BUILD_DIR)/alwaysontop.min.js.map \
		$(OUTPUT_DIR)/analytics-ga.js \
		$(BUILD_DIR)/analytics-ga.min.js \
		$(BUILD_DIR)/analytics-ga.min.js.map \
		$(BUILD_DIR)/facial-expressions-worker.min.js \
		$(BUILD_DIR)/facial-expressions-worker.min.js.map \
		$(DEPLOY_DIR)
	cp \
		$(BUILD_DIR)/close3.min.js \
		$(BUILD_DIR)/close3.min.js.map \
		$(DEPLOY_DIR) || true

deploy-lib-jitsi-meet:
	cp \
		$(LIBJITSIMEET_DIR)/dist/umd/lib-jitsi-meet.min.js \
		$(LIBJITSIMEET_DIR)/dist/umd/lib-jitsi-meet.min.map \
		$(LIBJITSIMEET_DIR)/dist/umd/lib-jitsi-meet.e2ee-worker.js \
		$(LIBJITSIMEET_DIR)/connection_optimization/external_connect.js \
		$(LIBJITSIMEET_DIR)/modules/browser/capabilities.json \
		$(DEPLOY_DIR)

deploy-libflac:
	cp \
		$(LIBFLAC_DIR)/libflac4-1.3.2.min.js \
		$(LIBFLAC_DIR)/libflac4-1.3.2.min.js.mem \
		$(DEPLOY_DIR)

deploy-olm:
	cp \
		$(OLM_DIR)/olm.wasm \
		$(DEPLOY_DIR)

deploy-tf-wasm:
	cp \
		$(TF_WASM_DIR)/*.wasm \
		$(DEPLOY_DIR)

deploy-rnnoise-binary:
	cp \
		$(RNNOISE_WASM_DIR)/rnnoise.wasm \
		$(DEPLOY_DIR)

deploy-tflite:
	cp \
		$(TFLITE_WASM)/*.wasm \
		$(DEPLOY_DIR)

deploy-meet-models:
	cp \
		$(MEET_MODELS_DIR)/*.tflite \
		$(DEPLOY_DIR)

deploy-facial-expressions:
	cp \
		$(FACIAL_MODELS_DIR)/* \
		$(DEPLOY_DIR)

deploy-css:
	$(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
	$(CLEANCSS) --skip-rebase $(STYLES_BUNDLE) > $(STYLES_DESTINATION) && \
	rm $(STYLES_BUNDLE)

deploy-local:
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

.NOTPARALLEL:
dev: deploy-init deploy-css deploy-rnnoise-binary deploy-tflite deploy-meet-models deploy-lib-jitsi-meet deploy-libflac deploy-olm deploy-tf-wasm deploy-facial-expressions
	$(WEBPACK_DEV_SERVER)

source-package:
	mkdir -p source_package/jitsi-meet/css && \
	cp -r *.js *.html resources/*.txt connection_optimization favicon.ico fonts images libs static sounds LICENSE lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
