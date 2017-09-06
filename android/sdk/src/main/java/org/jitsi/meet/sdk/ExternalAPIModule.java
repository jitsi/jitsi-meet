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
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.JitsiMeetViewListener;

import java.util.HashMap;

/**
 * Module implementing a simple API to enable a proximity sensor-controlled
 * wake lock. When the lock is held, if the proximity sensor detects a nearby
 * object it will dim the screen and disable touch controls. The functionality
 * is used with the conference audio-only mode.
 */
class ExternalAPIModule extends ReactContextBaseJavaModule {
    /**
     * React Native module name.
     */
    private static final String MODULE_NAME = "ExternalAPI";

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
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
        return MODULE_NAME;
    }

    /**
     * Dispatches an event that occurred on JavaScript to the view's listener.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    @ReactMethod
    public void sendEvent(String name, ReadableMap data, String scope) {
        // The JavaScript App needs to provide uniquely identifying information
        // to the native ExternalAPI module so that the latter may match the
        // former to the native JitsiMeetView which hosts it.
        JitsiMeetView view = JitsiMeetView.findViewByExternalAPIScope(scope);

        if (view == null) {
            return;
        }

        JitsiMeetViewListener listener = view.getListener();

        if (listener == null) {
            return;
        }

        switch (name) {
        case "CONFERENCE_FAILED":
            listener.onConferenceFailed(toHashMap(data));
            break;

        case "CONFERENCE_JOINED":
            listener.onConferenceJoined(toHashMap(data));
            break;

        case "CONFERENCE_LEFT":
            listener.onConferenceLeft(toHashMap(data));
            break;

        case "CONFERENCE_WILL_JOIN":
            listener.onConferenceWillJoin(toHashMap(data));
            break;

        case "CONFERENCE_WILL_LEAVE":
            listener.onConferenceWillLeave(toHashMap(data));
            break;
        }
    }

    /**
     * Initializes a new {@code HashMap} instance with the key-value
     * associations of a specific {@code ReadableMap}.
     *
     * @param readableMap the {@code ReadableMap} specifying the key-value
     * associations with which the new {@code HashMap} instance is to be
     * initialized.
     * @return a new {@code HashMap} instance initialized with the key-value
     * associations of the specified {@code readableMap}.
     */
    private HashMap<String, Object> toHashMap(ReadableMap readableMap) {
        HashMap<String, Object> hashMap = new HashMap<>();

        for (ReadableMapKeySetIterator i = readableMap.keySetIterator();
                i.hasNextKey();) {
            String key = i.nextKey();

            hashMap.put(key, readableMap.getString(key));
        }

        return hashMap;
    }
}
