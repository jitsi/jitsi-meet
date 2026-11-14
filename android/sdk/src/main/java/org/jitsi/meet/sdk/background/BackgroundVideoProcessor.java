package org.jitsi.meet.sdk.background;

import org.webrtc.SurfaceTextureHelper;
import org.webrtc.VideoFrame;
import org.webrtc.VideoProcessor;
import org.webrtc.VideoSink;

/** Adapts camera capture to the frame processor and balances frame ownership. */
final class BackgroundVideoProcessor implements VideoProcessor {
    private final BackgroundSession session;
    private final SurfaceTextureHelper textureHelper;
    private final BackgroundFrameProcessor frameProcessor;
    private volatile VideoSink sink;

    BackgroundVideoProcessor(BackgroundSession session, SurfaceTextureHelper textureHelper) {
        this.session = session;
        this.textureHelper = textureHelper;
        frameProcessor = new BackgroundFrameProcessor(session);
    }

    @Override
    public void onCapturerStarted(boolean success) {}

    @Override
    public void onCapturerStopped() {
        frameProcessor.invalidate();
    }

    @Override
    public void setSink(VideoSink sink) {
        this.sink = sink;
    }

    @Override
    public void onFrameCaptured(VideoFrame frame) {
        frame.retain();
        VideoFrame output = null;
        BackgroundSession.Snapshot settings = session.snapshot();
        long generation = settings.generation;
        try {
            try {
                output = frameProcessor.process(frame, textureHelper, settings);
                if (output != null) {
                    VideoFrame normalized = matchInputSize(output, frame);
                    if (normalized != output) {
                        VideoFrame previous = output;
                        output = normalized;
                        if (previous != frame) {
                            previous.release();
                        }
                    }
                }
            } catch (RuntimeException error) {
                if (output != null && output != frame) {
                    output.release();
                }
                output = null;
                if (session.isCurrent(settings.sessionId, generation)) {
                    session.reportUnavailable(generation);
                }
            }
            if (output == null) {
                output = BackgroundImageOps.black(frame.getBuffer().getWidth(),
                    frame.getBuffer().getHeight(), frame.getRotation(), frame.getTimestampNs());
            }
            session.forward(settings.sessionId, generation, output, sink);
        } finally {
            if (output != null && output != frame) {
                output.release();
            }
            frame.release();
        }
    }

    private static VideoFrame matchInputSize(VideoFrame output, VideoFrame input) {
        int width = input.getBuffer().getWidth();
        int height = input.getBuffer().getHeight();
        VideoFrame.Buffer buffer = output.getBuffer();
        if (buffer.getWidth() == width && buffer.getHeight() == height) {
            return output;
        }
        VideoFrame.Buffer scaled = buffer.cropAndScale(0, 0, buffer.getWidth(), buffer.getHeight(),
            width, height);
        if (scaled == null) {
            throw new IllegalStateException("Processed frame scaling failed");
        }
        try {
            return new VideoFrame(scaled, output.getRotation(), output.getTimestampNs());
        } catch (RuntimeException error) {
            scaled.release();
            throw error;
        }
    }
}
