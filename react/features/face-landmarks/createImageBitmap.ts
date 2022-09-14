/*
* Safari < 15 polyfill for createImageBitmap
* https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
*
* Support source image types: Canvas.
*/
// @ts-nocheck
if (!('createImageBitmap' in window)) {
    window.createImageBitmap = async function(data) {
        return new Promise((resolve, reject) => {
            let dataURL;

            if (data instanceof HTMLCanvasElement) {
                dataURL = data.toDataURL();
            } else {
                reject(new Error('createImageBitmap does not handle the provided image source type'));
            }
            const img = document.createElement('img');

            img.close = () => {
                // empty
            };

            img.addEventListener('load', () => {
                resolve(img);
            });

            img.src = dataURL;
        });
    };
}
