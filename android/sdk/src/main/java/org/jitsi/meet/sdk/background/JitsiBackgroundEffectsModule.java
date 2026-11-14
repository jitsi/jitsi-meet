package org.jitsi.meet.sdk.background;

import android.graphics.Bitmap;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.io.IOException;

/** React Native bridge for owner-scoped background sessions and selections. */
@ReactModule(name = JitsiBackgroundEffectsModule.NAME)
public final class JitsiBackgroundEffectsModule extends ReactContextBaseJavaModule {
    /** React Native module name. */
    public static final String NAME = "JitsiBackgroundEffects";
    private final BackgroundSession session;

    /**
     * Creates the bridge using the shared background session.
     *
     * @param context the React application context
     */
    public JitsiBackgroundEffectsModule(ReactApplicationContext context) {
        super(context);
        session = BackgroundSession.get(context);
    }

    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Resolves the current state for a matching owner and revision.
     *
     * @param owner the owner identifier
     * @param revision the owner revision
     * @param promise resolves with the state or rejects an invalid or stale owner
     */
    @ReactMethod
    public void getState(String owner, double revision, Promise promise) {
        if (owner == null || !Double.isFinite(revision) || revision < 0 || revision != Math.rint(revision)) {
            promise.reject("invalid_selection", "Background owner is required");
            return;
        }
        synchronized (session) {
            if (!session.isOwnerCurrent(owner, (long) revision)) {
                promise.reject("stale_session", "Background owner is no longer active");
                return;
            }
            promise.resolve(session.state());
        }
    }

    /**
     * Starts a session for a matching owner and revision and resolves its state.
     *
     * @param owner the owner identifier
     * @param revision the owner revision
     * @param promise resolves with the state or rejects an invalid or stale owner
     */
    @ReactMethod
    public void beginSession(String owner, double revision, Promise promise) {
        if (owner == null || !Double.isFinite(revision) || revision < 0 || revision != Math.rint(revision)) {
            promise.reject("invalid_selection", "Background owner is required");
            return;
        }
        synchronized (session) {
            if (session.begin(owner, (long) revision) == 0) {
                promise.reject("stale_session", "Background owner is no longer active");
                return;
            }
            promise.resolve(session.state());
        }
    }

    /**
     * Ends the active session if the owner and revision still match.
     *
     * @param owner the owner identifier
     * @param revision the owner revision
     * @param promise resolves after the request or rejects invalid input
     */
    @ReactMethod
    public void freeze(String owner, double revision, Promise promise) {
        if (owner == null || !Double.isFinite(revision) || revision < 0 || revision != Math.rint(revision)) {
            promise.reject("invalid_selection", "Background owner is required");
            return;
        }
        session.freeze(owner, (long) revision);
        promise.resolve(null);
    }

    /**
     * Ends the specified session if its owner and revision still match.
     *
     * @param owner the owner identifier
     * @param revision the owner revision
     * @param id the session identifier
     * @param promise resolves after the request or rejects invalid input
     */
    @ReactMethod
    public void endSession(String owner, double revision, double id, Promise promise) {
        if (owner == null || !Double.isFinite(revision) || revision < 0 || revision != Math.rint(revision)
                || !Double.isFinite(id) || id < 1 || id != Math.rint(id)) {
            promise.reject("invalid_selection", "Background owner and session are required");
            return;
        }
        session.end(owner, (long) revision, (long) id);
        promise.resolve(null);
    }

    /**
     * Applies a choice to a matching active session and resolves the updated state.
     *
     * @param owner the owner identifier
     * @param revision the owner revision
     * @param request the choice and session identifier
     * @param promise resolves with the state or rejects an invalid or stale selection
     */
    @ReactMethod
    public void select(String owner, double revision, ReadableMap request, Promise promise) {
        if (owner == null || !Double.isFinite(revision) || revision < 0 || revision != Math.rint(revision)
                || request == null || !request.hasKey("sessionId") || !request.hasKey("choice")) {
            promise.reject("invalid_selection", "Session and choice are required");
            return;
        }
        try {
            double id = request.getDouble("sessionId");
            String choice = request.getString("choice");
            if (!Double.isFinite(id) || id < 1 || id != Math.rint(id)) {
                promise.reject("invalid_selection", "Invalid background selection");
                return;
            }
            if (!session.isChoiceKnown(choice)) {
                promise.reject("invalid_selection", "Invalid background choice");
                return;
            }
            Bitmap selected = session.loadBackground(choice);
            synchronized (session) {
                if (!session.isOwnerCurrent(owner, (long) revision)) {
                    promise.reject("stale_session", "Background owner is no longer active");
                    return;
                }
                if (!session.applySelection((long) id, choice, selected)) {
                    promise.reject("stale_session", "Invalid or stale background selection");
                    return;
                }
                promise.resolve(session.state());
            }
        } catch (IOException | RuntimeException error) {
            promise.reject("invalid_selection", "Background selection failed", error);
        }
    }
}
