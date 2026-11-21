package org.jitsi.meet.sdk;

import android.content.Context;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import org.jitsi.meet.sdk.background.BackgroundSession;
import org.jitsi.meet.sdk.background.JitsiBackgroundEffectsModule;

/** Provides the ML Kit background engine and its React Native module. */
final class BackgroundEffectsProvider {
    private BackgroundEffectsProvider() {}

    static void initialize(Context context) {
        BackgroundSession.get(context);
    }

    @Nullable
    static NativeModule createNativeModule(ReactApplicationContext context) {
        return new JitsiBackgroundEffectsModule(context);
    }

    static long claimOwner(Context context, String owner) {
        return BackgroundSession.get(context).claimOwner(owner);
    }

    static long advanceOwner(Context context, String owner) {
        return BackgroundSession.get(context).advanceOwner(owner);
    }

    static void releaseOwner(Context context, String owner) {
        BackgroundSession.get(context).releaseOwner(owner);
    }
}
