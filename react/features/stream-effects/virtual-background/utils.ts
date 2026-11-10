export interface ICoverCropRect {
    sh: number;
    sw: number;
    sx: number;
    sy: number;
}

export interface ICoverCropCache {
    rect: ICoverCropRect | null;
    targetHeight: number;
    targetWidth: number;
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
    const scale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight);
    const sw = targetWidth / scale;
    const sh = targetHeight / scale;
    const sx = (imgWidth - sw) / 2;
    const sy = (imgHeight - sh) / 2;

    return {
        sh,
        sw,
        sx,
        sy
    };
}

/**
 * Draws an image onto a 2D canvas context applying object-fit: cover, caching the crop rect
 * so it is only recomputed when target canvas dimensions change.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLImageElement} img - The image element to draw.
 * @param {number} targetWidth - The destination canvas width.
 * @param {number} targetHeight - The destination canvas height.
 * @param {ICoverCropCache} cache - The cache holding the computed crop rect and dimensions.
 * @returns {void}
 */
export function drawImageWithCover(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        targetWidth: number,
        targetHeight: number,
        cache: ICoverCropCache
): void {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    if (nw && nh) {
        if (!cache.rect
            || cache.targetWidth !== targetWidth
            || cache.targetHeight !== targetHeight) {
            cache.rect = getCoverCropRect(nw, nh, targetWidth, targetHeight);
            cache.targetWidth = targetWidth;
            cache.targetHeight = targetHeight;
        }

        const { sx, sy, sw, sh } = cache.rect;

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    }
}
