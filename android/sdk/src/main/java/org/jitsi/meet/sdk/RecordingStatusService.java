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
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import javax.annotation.Nullable;

/**
 * Service for querying the current recording and transcribing status.
 *
 * <p>To request the status use {@link #getRecordingStatus(RecordingStatusCallback)}.
 * Do not construct recording-related intents manually — the request/response
 * lifecycle (requestId generation, callback routing) is managed entirely by this class.</p>
 *
 * Usage:
 * <pre>
 *   RecordingStatusService service = RecordingStatusService.getInstance();
 *   if (service != null) {
 *       service.getRecordingStatus(status -> {
 *           String fileRecording = status.get("fileRecording");   // "on" | "pending" | "off"
 *           String streamRecording = status.get("streamRecording"); // "on" | "pending" | "off"
 *           boolean transcribing = Boolean.parseBoolean(status.get("transcribing"));
 *       });
 *   }
 * </pre>
 */
public class RecordingStatusService extends android.content.BroadcastReceiver {

    private static final String TAG = RecordingStatusService.class.getSimpleName();
    private static final String REQUEST_ID = "requestId";
    private static final long TIMEOUT_MS = 5_000;

    private final Handler timeoutHandler = new Handler(Looper.getMainLooper());
    private final Map<String, RecordingStatusCallback> recordingStatusCallbackMap = new HashMap<>();
    private final Map<String, Runnable> timeoutRunnableMap = new HashMap<>();

    private static RecordingStatusService instance;

    /**
     * Returns the singleton instance, or {@code null} if {@link JitsiMeetView} has not yet
     * been initialized (i.e. before the React Native bridge is ready).
     */
    @Nullable
    public static RecordingStatusService getInstance() {
        return instance;
    }

    private RecordingStatusService(Context context) {
        LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(context);

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.RECORDING_STATUS_RETRIEVED.getAction());
        localBroadcastManager.registerReceiver(this, intentFilter);
    }

    static void init(Context context) {
        instance = new RecordingStatusService(context);
    }

    /**
     * Queries the current recording and transcribing status.
     *
     * @param callback Receives a map with keys:
     *                 "fileRecording"   — "on" | "pending" | "off"
     *                 "streamRecording" — "on" | "pending" | "off"
     *                 "transcribing"    — "true" | "false"
     */
    public void getRecordingStatus(RecordingStatusCallback callback) {
        Objects.requireNonNull(callback, "callback must not be null");
        String callbackKey = UUID.randomUUID().toString();
        this.recordingStatusCallbackMap.put(callbackKey, callback);

        Runnable timeoutRunnable = () -> {
            JitsiMeetLogger.w(TAG + " getRecordingStatus timed out, requestId: " + callbackKey);
            recordingStatusCallbackMap.remove(callbackKey);
            timeoutRunnableMap.remove(callbackKey);
        };
        timeoutRunnableMap.put(callbackKey, timeoutRunnable);
        timeoutHandler.postDelayed(timeoutRunnable, TIMEOUT_MS);

        String actionName = BroadcastAction.Type.GET_RECORDING_STATUS.getAction();
        WritableMap data = Arguments.createMap();
        data.putString(REQUEST_ID, callbackKey);
        ReactInstanceManagerHolder.emitEvent(actionName, data);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        BroadcastEvent event = new BroadcastEvent(intent);

        if (event.getType() != BroadcastEvent.Type.RECORDING_STATUS_RETRIEVED) {
            return;
        }

        String requestId = null;
        try {
            Map<String, Object> data = event.getData();
            requestId = (String) data.get(REQUEST_ID);

            RecordingStatusCallback callback = this.recordingStatusCallbackMap.get(requestId);
            if (callback == null) {
                return;
            }

            Map<String, String> status = new HashMap<>();
            status.put("fileRecording", data.get("fileRecording") != null ? data.get("fileRecording").toString() : null);
            status.put("streamRecording", data.get("streamRecording") != null ? data.get("streamRecording").toString() : null);
            status.put("transcribing", data.get("transcribing") != null ? data.get("transcribing").toString() : "false");
            callback.onReceived(status);
        } catch (Exception e) {
            JitsiMeetLogger.w(TAG + " error parsing recording status", e);
        } finally {
            if (requestId != null) {
                this.recordingStatusCallbackMap.remove(requestId);
                Runnable timeoutRunnable = timeoutRunnableMap.remove(requestId);
                if (timeoutRunnable != null) {
                    timeoutHandler.removeCallbacks(timeoutRunnable);
                }
            }
        }
    }

    public interface RecordingStatusCallback {
        void onReceived(Map<String, String> recordingStatus);
    }
}
