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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;
import java.util.Map;

/**
 * Module implementing an API for sending events from JavaScript to native code.
 */
@ReactModule(name = ExternalAPIModule.NAME)
class ExternalAPIModule extends ReactContextBaseJavaModule {

    public static final String NAME = "ExternalAPI";

    private static final String TAG = NAME;

    private final BroadcastEmitter broadcastEmitter;
    private final BroadcastReceiver broadcastReceiver;

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the app.
     *
     * @param reactContext the {@link ReactApplicationContext} where this module
     * is created.
     */
    public ExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext);

        broadcastEmitter = new BroadcastEmitter(reactContext);
        broadcastReceiver = new BroadcastReceiver(reactContext);

        ParticipantsService.init(reactContext);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
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
     * Gets a mapping with the constants this module is exporting.
     *
     * @return a {@link Map} mapping the constants to be exported with their
     * values.
     */
    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = new HashMap<>();

        constants.put("SET_AUDIO_MUTED", BroadcastAction.Type.SET_AUDIO_MUTED.getAction());
        constants.put("HANG_UP", BroadcastAction.Type.HANG_UP.getAction());
        constants.put("SEND_ENDPOINT_TEXT_MESSAGE", BroadcastAction.Type.SEND_ENDPOINT_TEXT_MESSAGE.getAction());
        constants.put("TOGGLE_SCREEN_SHARE", BroadcastAction.Type.TOGGLE_SCREEN_SHARE.getAction());
        constants.put("RETRIEVE_PARTICIPANTS_INFO", BroadcastAction.Type.RETRIEVE_PARTICIPANTS_INFO.getAction());
        constants.put("OPEN_CHAT", BroadcastAction.Type.OPEN_CHAT.getAction());
        constants.put("CLOSE_CHAT", BroadcastAction.Type.CLOSE_CHAT.getAction());
        constants.put("SEND_CHAT_MESSAGE", BroadcastAction.Type.SEND_CHAT_MESSAGE.getAction());
        constants.put("SET_VIDEO_MUTED", BroadcastAction.Type.SET_VIDEO_MUTED.getAction());
        constants.put("SET_CLOSED_CAPTIONS_ENABLED", BroadcastAction.Type.SET_CLOSED_CAPTIONS_ENABLED.getAction());
        constants.put("TOGGLE_CAMERA", BroadcastAction.Type.TOGGLE_CAMERA.getAction());
        constants.put("SHOW_NOTIFICATION", BroadcastAction.Type.SHOW_NOTIFICATION.getAction());
        constants.put("HIDE_NOTIFICATION", BroadcastAction.Type.HIDE_NOTIFICATION.getAction());
        constants.put("START_RECORDING", BroadcastAction.Type.START_RECORDING.getAction());
        constants.put("STOP_RECORDING", BroadcastAction.Type.STOP_RECORDING.getAction());
        constants.put("OVERWRITE_CONFIG", BroadcastAction.Type.OVERWRITE_CONFIG.getAction());
        constants.put("SEND_CAMERA_FACING_MODE_MESSAGE", BroadcastAction.Type.SEND_CAMERA_FACING_MODE_MESSAGE.getAction());

        return constants;
    }

    /**
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the native side.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     */
    @ReactMethod
    public void sendEvent(String name, ReadableMap data) {
        // Keep track of the current ongoing conference.
        OngoingConferenceTracker.getInstance().onExternalAPIEvent(name, data);

        JitsiMeetLogger.d(TAG + " Sending event: " + name + " with data: " + data);
        broadcastEmitter.sendBroadcast(name, data);
    }
}
