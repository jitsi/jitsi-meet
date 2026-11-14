package org.jitsi.meet.sdk.background;

import android.content.Context;
import android.graphics.Bitmap;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.mlkit.vision.segmentation.Segmenter;
import com.google.mlkit.vision.segmentation.Segmentation;
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions;
import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.webrtc.SurfaceTextureHelper;
import org.webrtc.VideoFrame;
import org.webrtc.VideoSink;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;

/** Holds the current background owner, session, selection, and segmentation resources. */
public final class BackgroundSession {
    static final ScheduledExecutorService WORKER = Executors.newSingleThreadScheduledExecutor();
    private static BackgroundSession instance;

    private final BackgroundCatalog catalog;
    private long nextSessionId;
    private long sessionId;
    private long generation;
    private boolean active;
    private String owner;
    private long ownerRevision;
    private String choice = "none";
    private String status = "inactive";
    private Bitmap background;
    private Segmenter segmenter;
    private final AtomicBoolean inferenceBusy = new AtomicBoolean();
    private final Set<BackgroundFrameProcessor> processors
        = Collections.newSetFromMap(new WeakHashMap<>());

    /**
     * Returns the shared session and initializes the camera processor factory if necessary.
     *
     * @param context an application context or a context from which to obtain one
     * @return the shared session
     */
    public static synchronized BackgroundSession get(Context context) {
        if (instance == null) {
            instance = new BackgroundSession(context);
        }
        return instance;
    }

    private BackgroundSession(Context context) {
        catalog = new BackgroundCatalog(context);
        WebRTCModuleOptions.getInstance().cameraVideoProcessorFactory
            = this::newVideoProcessor;
    }

    /**
     * Claims the session for an owner, ending the previous owner's session when it changes.
     *
     * @param requestedOwner the non-null owner identifier
     * @return the current owner revision
     */
    public synchronized long claimOwner(String requestedOwner) {
        if (!requestedOwner.equals(owner)) {
            end(sessionId);
            owner = requestedOwner;
            ownerRevision++;
        }
        return ownerRevision;
    }

    /**
     * Ends the current owner's session and advances its revision when the owner matches.
     *
     * @param requestedOwner the non-null owner identifier
     * @return the current owner revision
     */
    public synchronized long advanceOwner(String requestedOwner) {
        if (requestedOwner.equals(owner)) {
            freezeOwner(requestedOwner);
            ownerRevision++;
        }
        return ownerRevision;
    }

    private synchronized void freezeOwner(String requestedOwner) {
        if (requestedOwner.equals(owner)) {
            end(sessionId);
        }
    }

    /**
     * Ends the session and releases ownership if the identifier matches the current owner.
     *
     * @param requestedOwner the non-null owner identifier
     */
    public synchronized void releaseOwner(String requestedOwner) {
        if (requestedOwner.equals(owner)) {
            freezeOwner(requestedOwner);
            owner = null;
            ownerRevision++;
        }
    }

    synchronized boolean isOwnerCurrent(String requestedOwner, long requestedRevision) {
        return requestedOwner.equals(owner) && ownerRevision == requestedRevision;
    }

    synchronized long begin(String requestedOwner, long requestedRevision) {
        if (owner == null && requestedOwner.isEmpty()) {
            owner = "";
            ownerRevision = requestedRevision;
        }
        return requestedOwner.equals(owner) && ownerRevision == requestedRevision ? begin() : 0;
    }

    synchronized void freeze(String requestedOwner, long requestedRevision) {
        if (requestedOwner.equals(owner) && ownerRevision == requestedRevision) {
            freezeOwner(requestedOwner);
        }
    }

    synchronized void end(String requestedOwner, long requestedRevision, long requestedSessionId) {
        if (requestedOwner.equals(owner) && ownerRevision == requestedRevision) {
            end(requestedSessionId);
        }
    }

    private synchronized long begin() {
        sessionId = ++nextSessionId;
        active = true;
        generation++;
        choice = "none";
        status = "inactive";
        background = null;
        closeSegmenter();
        invalidateProcessors();
        return sessionId;
    }

    private synchronized void end(long ownedSessionId) {
        if (ownedSessionId != 0 && sessionId == ownedSessionId) {
            sessionId = 0;
            active = false;
            generation++;
            choice = "none";
            status = "inactive";
            background = null;
            closeSegmenter();
            invalidateProcessors();
        }
    }

    boolean isChoiceKnown(String requestedChoice) {
        return requestedChoice != null && (requestedChoice.equals("none") || requestedChoice.equals("blur")
            || requestedChoice.equals("blur-light") || catalog.contains(requestedChoice));
    }

    Bitmap loadBackground(String requestedChoice) throws IOException {
        return catalog.contains(requestedChoice) ? catalog.load(requestedChoice) : null;
    }

    synchronized boolean applySelection(long requestedSessionId, String requestedChoice, Bitmap selected) {
        if (!active || requestedSessionId == 0 || requestedSessionId != sessionId) {
            return false;
        }
        generation++;
        choice = requestedChoice;
        background = selected;
        status = requestedChoice.equals("none") ? "inactive" : "processing";
        invalidateProcessors();
        if (requestedChoice.equals("none")) {
            closeSegmenter();
        }
        return true;
    }

    synchronized Snapshot snapshot() {
        return new Snapshot(this);
    }

    BackgroundVideoProcessor newVideoProcessor(SurfaceTextureHelper textureHelper) {
        return new BackgroundVideoProcessor(this, textureHelper);
    }

    synchronized boolean isCurrent(long ownedSessionId, long expectedGeneration) {
        return active && ownedSessionId != 0 && sessionId == ownedSessionId
            && generation == expectedGeneration;
    }

    synchronized void forward(long ownedSessionId, long expectedGeneration,
            VideoFrame frame, VideoSink sink) {
        if (sink == null) {
            return;
        }
        if (isCurrent(ownedSessionId, expectedGeneration)) {
            sink.onFrame(frame);
            return;
        }
        VideoFrame black = BackgroundImageOps.black(frame.getBuffer().getWidth(),
            frame.getBuffer().getHeight(), frame.getRotation(), frame.getTimestampNs());
        try {
            sink.onFrame(black);
        } finally {
            black.release();
        }
    }

    synchronized void register(BackgroundFrameProcessor processor) {
        processors.add(processor);
    }

    boolean tryAcquireInference() {
        return inferenceBusy.compareAndSet(false, true);
    }

    void releaseInference() {
        inferenceBusy.set(false);
    }

    synchronized Segmenter segmenter(long expectedGeneration) {
        if (!active || generation != expectedGeneration || choice.equals("none")) {
            return null;
        }
        if (segmenter == null) {
            SelfieSegmenterOptions options = new SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
                .enableRawSizeMask()
                .build();
            segmenter = Segmentation.getClient(options);
        }
        return segmenter;
    }

    synchronized void reportReady(long expectedGeneration) {
        if (active && generation == expectedGeneration && !choice.equals("none")) {
            status = "processing";
        }
    }

    synchronized void reportUnavailable(long expectedGeneration) {
        if (active && generation == expectedGeneration && !choice.equals("none")) {
            status = "unavailable";
        }
    }

    synchronized WritableMap state() {
        WritableMap result = Arguments.createMap();
        result.putDouble("sessionId", sessionId);
        result.putString("choice", choice);
        result.putString("status", status);
        result.putArray("presets", catalog.getPresets());
        return result;
    }

    private void closeSegmenter() {
        if (segmenter != null) {
            segmenter.close();
            segmenter = null;
        }
    }

    private void invalidateProcessors() {
        for (BackgroundFrameProcessor processor : processors) {
            processor.invalidate();
        }
    }

    static final class Snapshot {
        final String owner;
        final long sessionId;
        final long generation;
        final boolean active;
        final String choice;
        final String status;
        final Bitmap background;

        Snapshot(BackgroundSession session) {
            owner = session.owner == null ? "" : session.owner;
            sessionId = session.sessionId;
            generation = session.generation;
            active = session.active;
            choice = session.choice;
            status = session.status;
            background = session.background;
        }
    }
}
