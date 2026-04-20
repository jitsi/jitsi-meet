BUILD_DIR = build
CLEANCSS = ./node_modules/.bin/cleancss
DEPLOY_DIR = libs
LIBJITSIMEET_DIR = node_modules/lib-jitsi-meet
OLM_DIR = node_modules/@matrix-org/olm
TF_WASM_DIR = node_modules/@tensorflow/tfjs-backend-wasm/dist/
RNNOISE_WASM_DIR = node_modules/@jitsi/rnnoise-wasm/dist
EXCALIDRAW_DIR = node_modules/@jitsi/excalidraw/dist/prod
EXCALIDRAW_DIR_DEV = node_modules/@jitsi/excalidraw/dist/dev
TFLITE_WASM = react/features/stream-effects/virtual-background/vendor/tflite
MEET_MODELS_DIR  = react/features/stream-effects/virtual-background/vendor/models
MEDIAPIPE_SEGMENTATION_DIR = node_modules/@mediapipe/selfie_segmentation
FACE_MODELS_DIR = node_modules/@vladmandic/human-models/models
NODE_SASS = ./node_modules/.bin/sass
NPM = npm
OUTPUT_DIR = .
STYLES_BUNDLE = css/all.bundle.css
STYLES_DESTINATION = css/all.css
STYLES_MAIN = css/main.scss
ifeq ($(OS),Windows_NT)
	WEBPACK = .\node_modules\.bin\webpack --progress
	WEBPACK_DEV_SERVER = .\node_modules\.bin\webpack serve --mode development --progress
else
	WEBPACK = ./node_modules/.bin/webpack --progress
	WEBPACK_DEV_SERVER = ./node_modules/.bin/webpack serve --mode development --progress
endif

all: compile deploy

compile: clean
	NODE_OPTIONS=--max-old-space-size=8192 \
	$(WEBPACK)

clean:
	rm -fr $(BUILD_DIR)

.NOTPARALLEL:
deploy: deploy-init deploy-appbundle deploy-rnnoise-binary deploy-excalidraw deploy-tflite deploy-meet-models deploy-mediapipe-segmentation deploy-lib-jitsi-meet deploy-olm deploy-tf-wasm deploy-css deploy-local deploy-face-landmarks

deploy-init:
	rm -fr $(DEPLOY_DIR)
	mkdir -p $(DEPLOY_DIR)

deploy-appbundle:
	cp \
		$(BUILD_DIR)/app.bundle.min.js \
		$(BUILD_DIR)/app.bundle.min.js.map \
		$(BUILD_DIR)/external_api.min.js \
		$(BUILD_DIR)/external_api.min.js.map \
		$(BUILD_DIR)/alwaysontop.min.js \
		$(BUILD_DIR)/alwaysontop.min.js.map \
		$(BUILD_DIR)/face-landmarks-worker.min.js \
		$(BUILD_DIR)/face-landmarks-worker.min.js.map \
		$(BUILD_DIR)/noise-suppressor-worklet.min.js \
		$(BUILD_DIR)/noise-suppressor-worklet.min.js.map \
		$(BUILD_DIR)/screenshot-capture-worker.min.js \
		$(BUILD_DIR)/screenshot-capture-worker.min.js.map \
		$(BUILD_DIR)/vb-inference-worker.min.js \
		$(BUILD_DIR)/vb-inference-worker.min.js.map \
		$(DEPLOY_DIR)
	cp \
		$(BUILD_DIR)/close3.min.js \
		$(BUILD_DIR)/close3.min.js.map \
		$(DEPLOY_DIR) || true
	cp -r $(BUILD_DIR)/chunks $(DEPLOY_DIR)/chunks

deploy-lib-jitsi-meet:
	cp \
		$(LIBJITSIMEET_DIR)/dist/umd/lib-jitsi-meet.* \
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

deploy-excalidraw:
	mkdir -p $(DEPLOY_DIR)/excalidraw
	cp -R $(EXCALIDRAW_DIR)/fonts $(DEPLOY_DIR)/excalidraw/

deploy-excalidraw-dev:
	mkdir -p $(DEPLOY_DIR)/excalidraw
	cp -R $(EXCALIDRAW_DIR_DEV)/fonts $(DEPLOY_DIR)/excalidraw/

deploy-meet-models:
	cp \
		$(MEET_MODELS_DIR)/selfie_segmentation_landscape.tflite \
		$(MEET_MODELS_DIR)/selfie_segmenter.tflite \
		$(DEPLOY_DIR)

deploy-mediapipe-segmentation:
	mkdir -p $(DEPLOY_DIR)/mediapipe-segmentation
	cp \
		$(MEDIAPIPE_SEGMENTATION_DIR)/selfie_segmentation* \
		$(DEPLOY_DIR)/mediapipe-segmentation

deploy-face-landmarks:
	cp \
		$(FACE_MODELS_DIR)/blazeface-front.bin \
		$(FACE_MODELS_DIR)/blazeface-front.json \
		$(FACE_MODELS_DIR)/emotion.bin \
		$(FACE_MODELS_DIR)/emotion.json \
		$(DEPLOY_DIR)

deploy-css:
	$(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
	$(CLEANCSS) --skip-rebase $(STYLES_BUNDLE) > $(STYLES_DESTINATION) && \
	rm $(STYLES_BUNDLE)

deploy-local:
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

.NOTPARALLEL:
dev: deploy-init deploy-css deploy-rnnoise-binary deploy-tflite deploy-meet-models deploy-mediapipe-segmentation deploy-lib-jitsi-meet deploy-olm deploy-tf-wasm deploy-excalidraw-dev deploy-face-landmarks
	$(WEBPACK_DEV_SERVER)

source-package: compile deploy
	mkdir -p source_package/jitsi-meet/css && \
	cp -r *.js *.html resources/*.txt fonts images libs static sounds LICENSE lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package
