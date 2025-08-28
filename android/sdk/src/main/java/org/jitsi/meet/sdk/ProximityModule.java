/*
 * Copyright @ 2017-present 8x8, Inc.
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

import android.content.Context;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module implementing a simple API to enable a proximity sensor-controlled
 * wake lock. When the lock is held, if the proximity sensor detects a nearby
 * object it will dim the screen and disable touch controls. The functionality
 * is used with the conference audio-only mode.
 */
@ReactModule(name = ProximityModule.NAME)
class ProximityModule extends ReactContextBaseJavaModule {

    public static final String NAME = "Proximity";

    /**
     * {@link WakeLock} instance.
     */
    private final WakeLock wakeLock;

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext The {@link ReactApplicationContext} where this module
     * is created.
     */
    public ProximityModule(ReactApplicationContext reactContext) {
        super(reactContext);

        WakeLock wakeLock;
        PowerManager powerManager
            = (PowerManager)
                reactContext.getSystemService(Context.POWER_SERVICE);

        try {
            wakeLock
                = powerManager.newWakeLock(
                        PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK,
                        "jitsi:"+NAME);
        } catch (Throwable ignored) {
            wakeLock = null;
        }

        this.wakeLock = wakeLock;
    }

    /**
     * Gets the name of this module to be used in the React Native bridge.
     *
     * @return The name of this module to be used in the React Native bridge.
     */
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Acquires / releases the proximity sensor wake lock.
     *
     * @param enabled {@code true} to enable the proximity sensor; otherwise,
     * {@code false}.
     */
    @ReactMethod
    public void setEnabled(final boolean enabled) {
        if (wakeLock == null) {
            return;
        }

        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (enabled) {
                    if (!wakeLock.isHeld()) {
                        wakeLock.acquire();
                    }
                } else if (wakeLock.isHeld()) {
                    wakeLock.release();
                }
            }
        });
    }
}
