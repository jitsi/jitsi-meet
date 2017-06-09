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

package org.jitsi.meet.sdk.audiomode;

import android.annotation.TargetApi;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

/**
 * Module implementing a simple API to select the appropriate audio device for a
 * conference call.
 *
 * Audio calls should use <tt>AudioModeModule.AUDIO_CALL</tt>, which uses the
 * builtin earpiece, wired headset or bluetooth headset. The builtin earpiece is
 * the default audio device.
 *
 * Video calls should should use <tt>AudioModeModule.VIDEO_CALL</tt>, which uses
 * the builtin speaker, earpiece, wired headset or bluetooth headset. The
 * builtin speaker is the default audio device.
 *
 * Before a call has started and after it has ended the
 * <tt>AudioModeModule.DEFAULT</tt> mode should be used.
 */
public class AudioModeModule extends ReactContextBaseJavaModule {
    /**
     * Constants representing the audio mode.
     * - DEFAULT: Used before and after every call. It represents the default
     *   audio routing scheme.
     * - AUDIO_CALL: Used for audio only calls. It will use the earpiece by
     *   default, unless a wired or Bluetooth headset is connected.
     * - VIDEO_CALL: Used for video calls. It will use the speaker by default,
     *   unless a wired or Bluetooth headset is connected.
     */
    private static final int DEFAULT    = 0;
    private static final int AUDIO_CALL = 1;
    private static final int VIDEO_CALL = 2;

    /**
     *
     */
    private static final String ACTION_HEADSET_PLUG
        = (Build.VERSION.SDK_INT >= 21)
            ? AudioManager.ACTION_HEADSET_PLUG
            : Intent.ACTION_HEADSET_PLUG;

    /**
     * React Native module name.
     */
    private static final String MODULE_NAME = "AudioMode";

    /**
     * Tag used when logging messages.
     */
    static final String TAG = MODULE_NAME;

    /**
     * {@link AudioManager} instance used to interact with the Android audio
     * subsystem.
     */
    private final AudioManager audioManager;

    /**
     * {@link BluetoothHeadsetMonitor} for detecting Bluetooth device changes in
     * old (< M) Android versions.
     */
    private BluetoothHeadsetMonitor bluetoothHeadsetMonitor;

    /**
     * {@link Handler} for running all operations on the main thread.
     */
    private final Handler mainThreadHandler
        = new Handler(Looper.getMainLooper());

    /**
     * {@link Runnable} for running update operation on the main thread.
     */
    private final Runnable mainThreadRunner
        = new Runnable() {
            @Override
            public void run() {
                if (mode != -1) {
                    updateAudioRoute(mode);
                }
            }
        };

    /**
     * Audio mode currently in use.
     */
    private int mode = -1;

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext the {@link ReactApplicationContext} where this module
     * is created.
     */
    public AudioModeModule(ReactApplicationContext reactContext) {
        super(reactContext);

        audioManager
            = (AudioManager)
                reactContext.getSystemService(Context.AUDIO_SERVICE);

        // Setup runtime device change detection.
        setupAudioRouteChangeDetection();
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

        constants.put("AUDIO_CALL", AUDIO_CALL);
        constants.put("DEFAULT", DEFAULT);
        constants.put("VIDEO_CALL", VIDEO_CALL);

        return constants;
    }

    /**
     * Gets the name for this module, to be used in the React Native bridge.
     *
     * @return a string with the module name.
     */
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Helper method to trigger an audio route update when devices change. It
     * makes sure the operation is performed on the main thread.
     */
    void onAudioDeviceChange() {
        mainThreadHandler.post(mainThreadRunner);
    }

    /**
     * Helper method to set the output route to a Bluetooth device.
     *
     * @param enabled true if Bluetooth should use used, false otherwise.
     */
    private void setBluetoothAudioRoute(boolean enabled) {
        if (enabled) {
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
        } else {
            audioManager.setBluetoothScoOn(false);
            audioManager.stopBluetoothSco();
        }
    }

    /**
     * Public method to set the current audio mode.
     *
     * @param mode the desired audio mode.
     * @param promise a {@link Promise} which will be resolved if the audio mode
     * could be updated successfully, and it will be rejected otherwise.
     */
    @ReactMethod
    public void setMode(final int mode, final Promise promise) {
        if (mode != DEFAULT && mode != AUDIO_CALL && mode != VIDEO_CALL) {
            promise.reject("setMode", "Invalid audio mode " + mode);
            return;
        }

        Runnable r = new Runnable() {
            @Override
            public void run() {
                boolean success;

                try {
                    success = updateAudioRoute(mode);
                } catch (Throwable e) {
                    success = false;
                    Log.e(
                            TAG,
                            "Failed to update audio route for mode: " + mode,
                            e);
                }
                if (success) {
                    AudioModeModule.this.mode = mode;
                    promise.resolve(null);
                } else {
                    promise.reject(
                            "setMode",
                            "Failed to set audio mode to " + mode);
                }
            }
        };
        mainThreadHandler.post(r);
    }

    /**
     * Setup the audio route change detection mechanism. We use the
     * {@link android.media.AudioDeviceCallback} API on Android >= 23 only.
     */
    private void setupAudioRouteChangeDetection() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            setupAudioRouteChangeDetectionM();
        } else {
            setupAudioRouteChangeDetectionPreM();
        }
    }

    /**
     * Audio route change detection mechanism for Android API >= 23.
     */
    @TargetApi(Build.VERSION_CODES.M)
    private void setupAudioRouteChangeDetectionM() {
        android.media.AudioDeviceCallback audioDeviceCallback =
                new android.media.AudioDeviceCallback() {
                    @Override
                    public void onAudioDevicesAdded(
                            AudioDeviceInfo[] addedDevices) {
                        Log.d(TAG, "Audio devices added");
                        onAudioDeviceChange();
                    }

                    @Override
                    public void onAudioDevicesRemoved(
                            AudioDeviceInfo[] removedDevices) {
                        Log.d(TAG, "Audio devices removed");
                        onAudioDeviceChange();
                    }
                };

        audioManager.registerAudioDeviceCallback(audioDeviceCallback, null);
    }

    /**
     * Audio route change detection mechanism for Android API < 23.
     */
    private void setupAudioRouteChangeDetectionPreM() {
        Context context = getReactApplicationContext();

        // Detect changes in wired headset connections.
        IntentFilter wiredHeadSetFilter = new IntentFilter(ACTION_HEADSET_PLUG);
        BroadcastReceiver wiredHeadsetReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.d(TAG, "Wired headset added / removed");
                onAudioDeviceChange();
            }
        };
        context.registerReceiver(wiredHeadsetReceiver, wiredHeadSetFilter);

        // Detect Bluetooth device changes.
        bluetoothHeadsetMonitor = new BluetoothHeadsetMonitor(this, context);
    }

    /**
     * Updates the audio route for the given mode.
     *
     * @param mode the audio mode to be used when computing the audio route.
     * @return true if the audio route was updated successfully, false
     * otherwise.
     */
    private boolean updateAudioRoute(int mode) {
        Log.d(TAG, "Update audio route for mode: " + mode);

        if (mode == DEFAULT) {
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.abandonAudioFocus(null);
            audioManager.setSpeakerphoneOn(false);
            setBluetoothAudioRoute(false);

            return true;
        }

        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.setMicrophoneMute(false);

        if (audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN)
                == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
            Log.d(TAG, "Audio focus request failed");
            return false;
        }

        boolean useSpeaker = (mode == VIDEO_CALL);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // On Android >= M we use the AudioDeviceCallback API, so turn on
            // Bluetooth SCO from the start.
            if (audioManager.isBluetoothScoAvailableOffCall()) {
                audioManager.startBluetoothSco();
            }
        } else {
            // On older Android versions we must set the Bluetooth route
            // manually. Also disable the speaker in that case.
            setBluetoothAudioRoute(
                    bluetoothHeadsetMonitor.isHeadsetAvailable());
            if (bluetoothHeadsetMonitor.isHeadsetAvailable()) {
                useSpeaker = false;
            }
        }

        // XXX: isWiredHeadsetOn is not deprecated when used just for knowing if
        // there is a wired headset connected, regardless of audio being routed
        // to it.
        audioManager.setSpeakerphoneOn(
                useSpeaker
                    && !(audioManager.isWiredHeadsetOn()
                        || audioManager.isBluetoothScoOn()));

        return true;
    }
}
