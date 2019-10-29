/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * Module implementing an API for sending events from JavaScript to native code.
 */
@ReactModule(name = ExternalAPIModule.NAME)
class ExternalAPIModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "ExternalAPI";

    private static final String TAG = NAME;

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the app.
     *
     * @param reactContext the {@link ReactApplicationContext} where this module
     * is created.
     */
    public ExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext);
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
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the specified {@link BaseReactView}'s listener.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    @ReactMethod
    public void sendEvent(String name, ReadableMap data, String scope) {
        // Keep track of the current ongoing conference.
        OngoingConferenceTracker.getInstance().onExternalAPIEvent(name, data);

        // The JavaScript App needs to provide uniquely identifying information
        // to the native ExternalAPI module so that the latter may match the
        // former to the native BaseReactView which hosts it.
        BaseReactView view = BaseReactView.findViewByExternalAPIScope(scope);

        if (view != null) {
            JitsiMeetLogger.d(TAG + " Sending event: " + name + " with data: " + data);
            try {
                view.onExternalAPIEvent(name, data);
            } catch(Exception e) {
                JitsiMeetLogger.e(e, TAG + " onExternalAPIEvent: error sending event");
            }
        }
    }
}
