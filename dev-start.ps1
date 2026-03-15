# dev-start.ps1
# Replicate 'make dev' for Windows/Powershell

$ErrorActionPreference = "Stop"

Write-Host "Cleaning and creating libs directory..."
if (Test-Path libs) { Remove-Item -Recurse -Force libs }
New-Item -ItemType Directory -Path libs -Force | Out-Null

Write-Host "Deploying CSS..."
# $(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
# $(CLEANCSS) --skip-rebase $(STYLES_BUNDLE) > $(STYLES_DESTINATION) && \
# rm $(STYLES_BUNDLE)
.\node_modules\.bin\sass css/main.scss css/all.bundle.css
.\node_modules\.bin\cleancss --skip-rebase css/all.bundle.css | Out-File -FilePath css/all.css -Encoding utf8
Remove-Item css/all.bundle.css

Write-Host "Deploying RNNoise binary..."
Copy-Item node_modules/@jitsi/rnnoise-wasm/dist/rnnoise.wasm libs/

Write-Host "Deploying TFLite..."
Copy-Item react/features/stream-effects/virtual-background/vendor/tflite/*.wasm libs/

Write-Host "Deploying Meet models..."
Copy-Item react/features/stream-effects/virtual-background/vendor/models/*.tflite libs/

Write-Host "Deploying lib-jitsi-meet..."
Copy-Item node_modules/lib-jitsi-meet/dist/umd/lib-jitsi-meet.* libs/

Write-Host "Deploying OLM..."
Copy-Item node_modules/@matrix-org/olm/olm.wasm libs/

Write-Host "Deploying TF WASM..."
Copy-Item node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm libs/

Write-Host "Deploying Excalidraw dev..."
Copy-Item -Recurse node_modules/@jitsi/excalidraw/dist/excalidraw-assets-dev libs/

Write-Host "Deploying Face Landmarks..."
Copy-Item node_modules/@vladmandic/human-models/models/blazeface-front.bin libs/
Copy-Item node_modules/@vladmandic/human-models/models/blazeface-front.json libs/
Copy-Item node_modules/@vladmandic/human-models/models/emotion.bin libs/
Copy-Item node_modules/@vladmandic/human-models/models/emotion.json libs/

Write-Host "Starting Webpack Dev Server..."
.\node_modules\.bin\webpack serve --mode development --progress
