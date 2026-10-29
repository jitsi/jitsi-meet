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
            } catch (RuntimeException error) {
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
}
