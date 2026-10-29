package org.jitsi.meet.sdk.background;

import android.graphics.Bitmap;
import android.graphics.Matrix;

import com.google.mlkit.vision.segmentation.SegmentationMask;

import org.webrtc.JavaI420Buffer;
import org.webrtc.VideoFrame;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/** Converts and composites camera frames and segmentation masks. */
final class BackgroundImageOps {
    private BackgroundImageOps() {}

    static Bitmap fromI420(VideoFrame.I420Buffer source, int width, int height) {
        int sourceWidth = source.getWidth();
        int sourceHeight = source.getHeight();
        int[] pixels = new int[width * height];
        ByteBuffer yPlane = source.getDataY();
        ByteBuffer uPlane = source.getDataU();
        ByteBuffer vPlane = source.getDataV();
        for (int y = 0; y < height; y++) {
            int sy = y * sourceHeight / height;
            for (int x = 0; x < width; x++) {
                int sx = x * sourceWidth / width;
                int luma = yPlane.get(sy * source.getStrideY() + sx) & 255;
                int chromaU = uPlane.get((sy / 2) * source.getStrideU() + sx / 2) & 255;
                int chromaV = vPlane.get((sy / 2) * source.getStrideV() + sx / 2) & 255;
                int c = Math.max(0, luma - 16);
                int d = chromaU - 128;
                int e = chromaV - 128;
                int red = clamp((298 * c + 409 * e + 128) >> 8);
                int green = clamp((298 * c - 100 * d - 208 * e + 128) >> 8);
                int blue = clamp((298 * c + 516 * d + 128) >> 8);
                pixels[y * width + x] = 0xff000000 | red << 16 | green << 8 | blue;
            }
        }
        return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888);
    }

    static Bitmap upright(Bitmap image, int rotation) {
        if (rotation == 0) {
            return image;
        }
        Matrix matrix = new Matrix();
        matrix.postRotate(rotation);
        return Bitmap.createBitmap(image, 0, 0, image.getWidth(), image.getHeight(), matrix, true);
    }

    static Bitmap compose(Bitmap foreground, SegmentationMask mask, BackgroundSession.Snapshot settings, int rotation) {
        int width = foreground.getWidth();
        int height = foreground.getHeight();
        int[] front = new int[width * height];
        int[] back = new int[width * height];
        int[] output = new int[width * height];
        foreground.getPixels(front, 0, width, 0, 0, width, height);
        Bitmap background = settings.background != null
            ? presetForFrame(settings.background, width, height, rotation)
            : blur(foreground, settings.choice.equals("blur-light") ? 8 : 16);
        background.getPixels(back, 0, width, 0, 0, width, height);
        if (background != settings.background) {
            background.recycle();
        }
        MaskSampler sampler = new MaskSampler(mask);
        int uprightWidth = rotation == 90 || rotation == 270 ? height : width;
        int uprightHeight = rotation == 90 || rotation == 270 ? width : height;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int ux = rotation == 90 ? height - 1 - y : rotation == 180 ? width - 1 - x
                    : rotation == 270 ? y : x;
                int uy = rotation == 90 ? x : rotation == 180 ? height - 1 - y
                    : rotation == 270 ? width - 1 - x : y;
                float alpha = sampler.sample(
                    ux * (sampler.width - 1f) / Math.max(1, uprightWidth - 1),
                    uy * (sampler.height - 1f) / Math.max(1, uprightHeight - 1));
                alpha = Math.min(1f, Math.max(0f, (alpha - 0.25f) / 0.5f));
                output[y * width + x] = blend(front[y * width + x], back[y * width + x], alpha);
            }
        }
        return Bitmap.createBitmap(output, width, height, Bitmap.Config.ARGB_8888);
    }

    private static final class MaskSampler {
        final int width;
        final int height;
        final float[] values;

        MaskSampler(SegmentationMask mask) {
            width = mask.getWidth();
            height = mask.getHeight();
            values = new float[width * height];
            ByteBuffer buffer = mask.getBuffer().duplicate().order(ByteOrder.nativeOrder());
            for (int i = 0; i < values.length; i++) {
                values[i] = buffer.getFloat();
            }
        }

        float sample(float x, float y) {
            int x0 = Math.min(width - 1, (int) x);
            int y0 = Math.min(height - 1, (int) y);
            int x1 = Math.min(width - 1, x0 + 1);
            int y1 = Math.min(height - 1, y0 + 1);
            float fx = x - x0;
            float fy = y - y0;
            float top = values[y0 * width + x0] * (1 - fx) + values[y0 * width + x1] * fx;
            float bottom = values[y1 * width + x0] * (1 - fx) + values[y1 * width + x1] * fx;
            return top * (1 - fy) + bottom * fy;
        }
    }

    private static int blend(int front, int back, float alpha) {
        int red = (int) (((front >> 16) & 255) * alpha + ((back >> 16) & 255) * (1 - alpha));
        int green = (int) (((front >> 8) & 255) * alpha + ((back >> 8) & 255) * (1 - alpha));
        int blue = (int) ((front & 255) * alpha + (back & 255) * (1 - alpha));
        return 0xff000000 | red << 16 | green << 8 | blue;
    }

    private static Bitmap centerCrop(Bitmap source, int width, int height) {
        float target = (float) width / height;
        int cropWidth = source.getWidth();
        int cropHeight = source.getHeight();
        if ((float) cropWidth / cropHeight > target) {
            cropWidth = Math.max(1, Math.round(cropHeight * target));
        } else {
            cropHeight = Math.max(1, Math.round(cropWidth / target));
        }
        Bitmap crop = Bitmap.createBitmap(source,
            (source.getWidth() - cropWidth) / 2, (source.getHeight() - cropHeight) / 2,
            cropWidth, cropHeight);
        Bitmap result = Bitmap.createScaledBitmap(crop, width, height, true);
        if (crop != source && crop != result) {
            crop.recycle();
        }
        return result;
    }

    private static Bitmap presetForFrame(Bitmap preset, int width, int height, int rotation) {
        int uprightWidth = rotation == 90 || rotation == 270 ? height : width;
        int uprightHeight = rotation == 90 || rotation == 270 ? width : height;
        Bitmap cropped = centerCrop(preset, uprightWidth, uprightHeight);
        Bitmap raw = upright(cropped, (360 - rotation) % 360);
        if (cropped != preset && cropped != raw) {
            cropped.recycle();
        }
        return raw;
    }

    private static Bitmap blur(Bitmap source, int radius) {
        int width = source.getWidth();
        int height = source.getHeight();
        int[] input = new int[width * height];
        int[] horizontal = new int[input.length];
        int[] output = new int[input.length];
        source.getPixels(input, 0, width, 0, 0, width, height);
        for (int y = 0; y < height; y++) {
            int red = 0, green = 0, blue = 0;
            for (int x = -radius; x <= radius; x++) {
                int color = input[y * width + Math.max(0, Math.min(width - 1, x))];
                red += color >> 16 & 255;
                green += color >> 8 & 255;
                blue += color & 255;
            }
            for (int x = 0; x < width; x++) {
                horizontal[y * width + x] = pack(red, green, blue, radius * 2 + 1);
                int remove = input[y * width + Math.max(0, x - radius)];
                int add = input[y * width + Math.min(width - 1, x + radius + 1)];
                red += (add >> 16 & 255) - (remove >> 16 & 255);
                green += (add >> 8 & 255) - (remove >> 8 & 255);
                blue += (add & 255) - (remove & 255);
            }
        }
        for (int x = 0; x < width; x++) {
            int red = 0, green = 0, blue = 0;
            for (int y = -radius; y <= radius; y++) {
                int color = horizontal[Math.max(0, Math.min(height - 1, y)) * width + x];
                red += color >> 16 & 255;
                green += color >> 8 & 255;
                blue += color & 255;
            }
            for (int y = 0; y < height; y++) {
                output[y * width + x] = pack(red, green, blue, radius * 2 + 1);
                int remove = horizontal[Math.max(0, y - radius) * width + x];
                int add = horizontal[Math.min(height - 1, y + radius + 1) * width + x];
                red += (add >> 16 & 255) - (remove >> 16 & 255);
                green += (add >> 8 & 255) - (remove >> 8 & 255);
                blue += (add & 255) - (remove & 255);
            }
        }
        return Bitmap.createBitmap(output, width, height, Bitmap.Config.ARGB_8888);
    }

    private static int pack(int red, int green, int blue, int divisor) {
        return 0xff000000 | red / divisor << 16 | green / divisor << 8 | blue / divisor;
    }

    static JavaI420Buffer toI420(Bitmap image) {
        int width = image.getWidth();
        int height = image.getHeight();
        JavaI420Buffer buffer = JavaI420Buffer.allocate(width, height);
        int[] pixels = new int[width * height];
        image.getPixels(pixels, 0, width, 0, 0, width, height);
        ByteBuffer yPlane = buffer.getDataY();
        ByteBuffer uPlane = buffer.getDataU();
        ByteBuffer vPlane = buffer.getDataV();
        for (int y = 0; y < height; y += 2) {
            for (int x = 0; x < width; x += 2) {
                int uSum = 0;
                int vSum = 0;
                int count = 0;
                for (int dy = 0; dy < 2 && y + dy < height; dy++) {
                    for (int dx = 0; dx < 2 && x + dx < width; dx++) {
                        int color = pixels[(y + dy) * width + x + dx];
                        int r = color >> 16 & 255, g = color >> 8 & 255, b = color & 255;
                        yPlane.put((y + dy) * buffer.getStrideY() + x + dx,
                            (byte) clamp((66 * r + 129 * g + 25 * b + 128 >> 8) + 16));
                        uSum += clamp((-38 * r - 74 * g + 112 * b + 128 >> 8) + 128);
                        vSum += clamp((112 * r - 94 * g - 18 * b + 128 >> 8) + 128);
                        count++;
                    }
                }
                uPlane.put(y / 2 * buffer.getStrideU() + x / 2, (byte) (uSum / count));
                vPlane.put(y / 2 * buffer.getStrideV() + x / 2, (byte) (vSum / count));
            }
        }
        return buffer;
    }

    static VideoFrame black(int width, int height, int rotation, long timestampNs) {
        JavaI420Buffer buffer = JavaI420Buffer.allocate(width, height);
        ByteBuffer y = buffer.getDataY(), u = buffer.getDataU(), v = buffer.getDataV();
        for (int i = 0; i < y.capacity(); i++) y.put(i, (byte) 16);
        for (int i = 0; i < u.capacity(); i++) u.put(i, (byte) 128);
        for (int i = 0; i < v.capacity(); i++) v.put(i, (byte) 128);
        return new VideoFrame(buffer, rotation, timestampNs);
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }
}
