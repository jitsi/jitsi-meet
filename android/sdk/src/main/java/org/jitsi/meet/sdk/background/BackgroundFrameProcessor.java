package org.jitsi.meet.sdk.background;

import android.graphics.Bitmap;
import android.os.SystemClock;

import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.segmentation.Segmenter;
import com.google.mlkit.vision.segmentation.SegmentationMask;

import org.webrtc.JavaI420Buffer;
import org.webrtc.SurfaceTextureHelper;
import org.webrtc.VideoFrame;

import java.util.concurrent.TimeUnit;

/** Processes camera frames using the current session and asynchronous segmentation results. */
final class BackgroundFrameProcessor implements VideoFrameProcessor {
    private static final int MAX_EDGE = 640;
    private static final long MAX_FRAME_AGE_MS = 500;
    private final BackgroundSession session;
    private final String owner;
    private long generation = -1;
    private int width;
    private int height;
    private int rotation;
    private final RequestTracker requests = new RequestTracker();
    private VideoFrame completed;
    private long completedAt;

    BackgroundFrameProcessor(BackgroundSession session) {
        this.session = session;
        owner = session.snapshot().owner;
        session.register(this);
    }

    /**
     * Returns the input frame for an active unmodified selection, or an owned output frame.
     * Unavailable or stale results produce a black frame. Pending requests reuse
     * a fresh completed frame, falling back to black when none is available.
     *
     * @param frame the captured frame, retained by the caller
     * @param textureHelper the capture texture helper
     * @return the input frame or a newly owned frame
     */
    @Override
    public VideoFrame process(VideoFrame frame, SurfaceTextureHelper textureHelper) {
        return process(frame, textureHelper, session.snapshot());
    }

    VideoFrame process(VideoFrame frame, SurfaceTextureHelper textureHelper, BackgroundSession.Snapshot settings) {
        int sourceWidth = frame.getBuffer().getWidth();
        int sourceHeight = frame.getBuffer().getHeight();
        int scaledWidth = Math.max(2, sourceWidth * Math.min(MAX_EDGE, Math.max(sourceWidth, sourceHeight))
            / Math.max(sourceWidth, sourceHeight));
        int scaledHeight = Math.max(2, sourceHeight * Math.min(MAX_EDGE, Math.max(sourceWidth, sourceHeight))
            / Math.max(sourceWidth, sourceHeight));
        final int outputWidth = scaledWidth & ~1;
        final int outputHeight = scaledHeight & ~1;
        final int outputRotation = frame.getRotation();
        final long timestampNs = frame.getTimestampNs();
        if (!settings.active || !owner.equals(settings.owner)) {
            return BackgroundImageOps.black(outputWidth, outputHeight, outputRotation, timestampNs);
        }
        if (settings.choice.equals("none")) {
            return session.isCurrent(settings.sessionId, settings.generation)
                ? frame : BackgroundImageOps.black(outputWidth, outputHeight, outputRotation, timestampNs);
        }
        if (settings.status.equals("unavailable")) {
            return BackgroundImageOps.black(outputWidth, outputHeight, outputRotation, timestampNs);
        }
        boolean failed = false;
        VideoFrame result = null;
        synchronized (this) {
            if (generation != settings.generation || width != outputWidth
                    || height != outputHeight || rotation != outputRotation) {
                invalidate();
                generation = settings.generation;
                width = outputWidth;
                height = outputHeight;
                rotation = outputRotation;
            }
            if (!requests.isInFlight() && session.tryAcquireInference()) {
                VideoFrame.I420Buffer input = null;
                try {
                    input = frame.getBuffer().toI420();
                    VideoFrame.I420Buffer ownedInput = input;
                    FrameRequest request = new FrameRequest(settings, outputWidth, outputHeight, frame);
                    request.token = requests.begin();
                    BackgroundSession.WORKER.execute(() -> submit(ownedInput, request));
                } catch (RuntimeException error) {
                    if (input != null) input.release();
                    requests.clear();
                    session.releaseInference();
                    failed = true;
                }
            }
            if (completed != null && SystemClock.uptimeMillis() - completedAt <= MAX_FRAME_AGE_MS) {
                completed.getBuffer().retain();
                result = new VideoFrame(completed.getBuffer(), rotation, timestampNs);
            }
        }
        if (failed) session.reportUnavailable(settings.generation);
        BackgroundSession.Snapshot current = session.snapshot();
        if (!current.active || current.sessionId != settings.sessionId
                || current.generation != settings.generation) {
            if (result != null) result.release();
            return BackgroundImageOps.black(outputWidth, outputHeight, outputRotation, timestampNs);
        }
        return result != null ? result : BackgroundImageOps.black(
            outputWidth, outputHeight, outputRotation, timestampNs);
    }

    private void submit(VideoFrame.I420Buffer input, FrameRequest request) {
        Bitmap original = null;
        try {
            original = BackgroundImageOps.fromI420(input, request.width, request.height);
        } catch (RuntimeException error) {
            fail(request);
            return;
        } finally {
            input.release();
        }
        Bitmap upright = null;
        try {
            upright = BackgroundImageOps.upright(original, request.rotation);
            Segmenter segmenter = session.segmenter(request.settings.generation);
            if (segmenter == null) {
                discard(original, upright);
                fail(request);
                return;
            }
            Bitmap captured = original;
            Bitmap inference = upright;
            segmenter.process(InputImage.fromBitmap(upright, 0))
                .addOnCompleteListener(BackgroundSession.WORKER, task -> {
                    if (task.isSuccessful()) {
                        finish(captured, inference, task.getResult(), request);
                    } else {
                        discard(captured, inference);
                        fail(request);
                    }
                });
        } catch (RuntimeException error) {
            discard(original, upright);
            fail(request);
        }
    }

    private void finish(Bitmap original, Bitmap upright, SegmentationMask mask,
            FrameRequest request) {
        VideoFrame result = null;
        try {
            BackgroundSession.Snapshot current = session.snapshot();
            if (!current.active || current.sessionId != request.settings.sessionId
                    || current.generation != request.settings.generation || !isCurrent(request)) {
                return;
            }
            Bitmap composite = BackgroundImageOps.compose(
                original, mask, request.settings, request.rotation);
            try {
                JavaI420Buffer buffer = BackgroundImageOps.toI420(composite);
                result = new VideoFrame(buffer, request.rotation, request.timestampNs);
            } finally {
                composite.recycle();
            }
            synchronized (this) {
                if (isCurrent(request) && generation == request.settings.generation
                        && width == result.getBuffer().getWidth()
                        && height == result.getBuffer().getHeight() && rotation == request.rotation) {
                    releaseCompleted();
                    completed = result;
                    completedAt = SystemClock.uptimeMillis();
                    result = null;
                    BackgroundSession.WORKER.schedule(() -> expire(request.settings.generation),
                        MAX_FRAME_AGE_MS, TimeUnit.MILLISECONDS);
                }
            }
            if (isCurrent(request)) session.reportReady(request.settings.generation);
        } catch (RuntimeException error) {
            if (isCurrent(request)) session.reportUnavailable(request.settings.generation);
        } finally {
            if (result != null) result.release();
            discard(original, upright);
            clearInFlight(request.token);
            session.releaseInference();
        }
    }

    private void fail(FrameRequest request) {
        if (isCurrent(request)) session.reportUnavailable(request.settings.generation);
        clearInFlight(request.token);
        session.releaseInference();
    }

    private synchronized void clearInFlight(long requestToken) {
        requests.complete(requestToken);
    }

    private synchronized boolean isCurrent(FrameRequest request) {
        return requests.isCurrent(request.token) && generation == request.settings.generation
            && width == request.width && height == request.height && rotation == request.rotation;
    }

    private synchronized void expire(long expectedGeneration) {
        if (generation == expectedGeneration
                && SystemClock.uptimeMillis() - completedAt >= MAX_FRAME_AGE_MS) {
            releaseCompleted();
        }
    }

    synchronized void invalidate() {
        requests.invalidate();
        releaseCompleted();
        generation = -1;
    }

    private void releaseCompleted() {
        if (completed != null) {
            completed.release();
            completed = null;
        }
    }

    private void discard(Bitmap original, Bitmap upright) {
        if (upright != null && upright != original) upright.recycle();
        if (original != null) original.recycle();
    }

    static final class RequestTracker {
        private long activeToken;
        private long currentToken;

        boolean isInFlight() {
            return activeToken != 0;
        }

        long begin() {
            activeToken = ++currentToken;
            return activeToken;
        }

        boolean isCurrent(long token) {
            return token != 0 && token == activeToken && token == currentToken;
        }

        void invalidate() {
            currentToken++;
        }

        void complete(long token) {
            if (activeToken == token) {
                activeToken = 0;
            }
        }

        void clear() {
            activeToken = 0;
        }
    }

    private static final class FrameRequest {
        final BackgroundSession.Snapshot settings;
        final int width;
        final int height;
        final int rotation;
        final long timestampNs;
        long token;

        FrameRequest(BackgroundSession.Snapshot settings, int width, int height, VideoFrame frame) {
            this.settings = settings;
            this.width = width;
            this.height = height;
            rotation = frame.getRotation();
            timestampNs = frame.getTimestampNs();
        }
    }
}
