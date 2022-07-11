/*
* Safari polyfill for createImageBitmap
* https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
*
* Support source image types: Canvas.
*/
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

            img.addEventListener('load', () => {
                resolve(img);
            });
            img.src = dataURL;
        });
    };
}
