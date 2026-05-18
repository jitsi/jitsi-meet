// Tell Emscripten where to find olm.wasm when @matrix-org/olm is bundled by webpack.
// This must evaluate before the @matrix-org/olm module is initialized.
window.OLM_OPTIONS = {
    locateFile: filename => `libs/${filename}`
};
