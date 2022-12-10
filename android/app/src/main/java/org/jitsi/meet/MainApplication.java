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

package org.jitsi.meet;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;

import org.jitsi.meet.sdk.JitsiReactNativeHost;

/**
 * Application class for Jitsi Meet. The only reason why this exists is for Detox
 * to believe our app is a "greenfield" app. SDK users need not use this.
 */
public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = new JitsiReactNativeHost(this);

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize RN
        Log.d(this.getClass().getCanonicalName(), "app onCreate");
        getReactNativeHost().getReactInstanceManager();
    }
}
