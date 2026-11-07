export interface ICoverCropRect {
    sh: number;
    sw: number;
    sx: number;
    sy: number;
}

/**
 * Computes the source rectangle that crops an image to fill a target canvas
 * while maintaining its aspect ratio (equivalent to object-fit: cover).
 *
 * @param {number} imgWidth - The source image natural width.
 * @param {number} imgHeight - The source image natural height.
 * @param {number} targetWidth - The destination canvas width.
 * @param {number} targetHeight - The destination canvas height.
 * @returns {ICoverCropRect} The source crop rectangle coordinates and dimensions.
 */
export function getCoverCropRect(
        imgWidth: number,
        imgHeight: number,
        targetWidth: number,
        targetHeight: number
): ICoverCropRect {
    const nw = imgWidth || targetWidth;
    const nh = imgHeight || targetHeight;
    const scale = Math.max(targetWidth / nw, targetHeight / nh);
    const sw = targetWidth / scale;
    const sh = targetHeight / scale;
    const sx = (nw - sw) / 2;
    const sy = (nh - sh) / 2;

    return {
        sh,
        sw,
        sx,
        sy
    };
}

