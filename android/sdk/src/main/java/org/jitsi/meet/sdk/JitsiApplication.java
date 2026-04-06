/*
 * Copyright @ 2022-present 8x8, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.jitsi.meet.sdk;

import android.app.Application;

import androidx.annotation.Nullable;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultReactHost;

import java.util.Collections;

/**
 * Base Application class for Jitsi Meet that implements {@link ReactApplication}.
 *
 * Initialization (SoLoader, new architecture, WebRTC, ReactHost startup) is handled
 * automatically by {@link JitsiInitializer} via {@code androidx.startup}.
 * Consumers can extend this class for convenience, or use their own Application
 * class — the SDK will initialize itself either way.
 */
public class JitsiApplication extends Application implements ReactApplication {
    private ReactHost mReactHost;

    @Override
    public ReactNativeHost getReactNativeHost() {
        // Not used — getReactHost() is overridden and used directly.
        // Required by the ReactApplication interface in react-android 0.81.x.
        return new com.facebook.react.defaults.DefaultReactNativeHost(this) {
            @Override public boolean getUseDeveloperSupport() { return BuildConfig.DEBUG; }
            @Override protected java.util.List<com.facebook.react.ReactPackage> getPackages() {
                return ReactHostHolder.getReactNativePackages();
            }
            @Override protected String getJSMainModuleName() { return "index.android"; }
            @Override protected String getBundleAssetName() { return "index.android.bundle"; }
            @Override protected boolean isNewArchEnabled() { return true; }
        };
    }

    @Nullable
    @Override
    public ReactHost getReactHost() {
        if (mReactHost == null) {
            mReactHost = DefaultReactHost.getDefaultReactHost(
                this,
                ReactHostHolder.getReactNativePackages(),
                "index.android",       /* jsMainModulePath */
                "index.android.bundle", /* jsBundleAssetPath */
                null,                   /* jsBundleFilePath */
                null,                   /* jsRuntimeFactory (defaults to Hermes) */
                BuildConfig.DEBUG, /* useDevSupport */
                Collections.emptyList(), /* cxxReactPackageProviders */
                e -> { throw new RuntimeException(e); }, /* exceptionHandler */
                null                    /* bindingsInstaller */
            );
        }
        return mReactHost;
    }
}