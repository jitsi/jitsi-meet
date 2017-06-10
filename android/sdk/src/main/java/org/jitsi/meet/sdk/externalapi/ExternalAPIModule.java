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

package org.jitsi.meet.sdk.externalapi;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.JitsiMeetViewListener;

import java.util.HashMap;

/**
 * Module implementing a simple API to enable a proximity sensor-controlled
 * wake lock. When the lock is held, if the proximity sensor detects a nearby
 * object it will dim the screen and disable touch controls. The functionality
 * is used with the conference audio-only mode.
 */
public class ExternalAPIModule extends ReactContextBaseJavaModule {
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

        // TODO Converting a ReadableMap to a HashMap is not supported until
        // React Native 0.46.
        HashMap<String, Object> dataMap = new HashMap<>();

        switch (name) {
        case "CONFERENCE_FAILED":
            dataMap.put("error", data.getString("error"));
            dataMap.put("url", data.getString("url"));
            listener.onConferenceFailed(dataMap);
            break;

        case "CONFERENCE_JOINED":
            dataMap.put("url", data.getString("url"));
            listener.onConferenceJoined(dataMap);
            break;

        case "CONFERENCE_LEFT":
            dataMap.put("url", data.getString("url"));
            listener.onConferenceLeft(dataMap);
            break;

        case "CONFERENCE_WILL_JOIN":
            dataMap.put("url", data.getString("url"));
            listener.onConferenceWillJoin(dataMap);
            break;

        case "CONFERENCE_WILL_LEAVE":
            dataMap.put("url", data.getString("url"));
            listener.onConferenceWillLeave(dataMap);
            break;
        }
    }
}
