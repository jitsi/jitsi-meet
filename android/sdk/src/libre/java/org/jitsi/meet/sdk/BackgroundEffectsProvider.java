package org.jitsi.meet.sdk;

import android.content.Context;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

/** Provides no background engine or React Native module for Libre builds. */
final class BackgroundEffectsProvider {
    private BackgroundEffectsProvider() {}

    static void initialize(Context context) {}

    @Nullable
    static NativeModule createNativeModule(ReactApplicationContext context) {
        return null;
    }

    static long claimOwner(Context context, String owner) {
        return 0;
    }

    static long advanceOwner(Context context, String owner) {
        return 0;
    }

    static void releaseOwner(Context context, String owner) {}
}
