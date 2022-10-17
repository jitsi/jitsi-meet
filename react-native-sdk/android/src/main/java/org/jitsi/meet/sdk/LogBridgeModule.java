/*
 * Copyright @ 2019-present 8x8, Inc.
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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import javax.annotation.Nonnull;

/**
 * Module implementing a "bridge" between the JS loggers and the native one.
 */
@ReactModule(name = LogBridgeModule.NAME)
class LogBridgeModule extends ReactContextBaseJavaModule {
    public static final String NAME = "LogBridge";

    public LogBridgeModule(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void trace(final String message) {
        JitsiMeetLogger.v(message);
    }

    @ReactMethod
    public void debug(final String message) {
        JitsiMeetLogger.d(message);
    }

    @ReactMethod
    public void info(final String message) {
        JitsiMeetLogger.i(message);
    }

    @ReactMethod
    public void log(final String message) {
        JitsiMeetLogger.i(message);
    }

    @ReactMethod
    public void warn(final String message) {
        JitsiMeetLogger.w(message);
    }

    @ReactMethod
    public void error(final String message) {
        JitsiMeetLogger.e(message);
    }
}
