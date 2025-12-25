package org.jitsi.meet.sdk;

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults;

/**
 * Custom React Native New Architecture feature flags for Jitsi.
 */
public class JitsiReactNativeFeatureFlags extends ReactNativeFeatureFlagsDefaults {

    @Override
    public boolean enableFabricRenderer() {
        return false;
    }

    @Override
    public boolean enableFabricLogs() {
        return false;
    }

    @Override
    public boolean useTurboModules() {
        return false;
    }

    @Override
    public boolean enableBridgelessArchitecture() {
        return false;
    }
}