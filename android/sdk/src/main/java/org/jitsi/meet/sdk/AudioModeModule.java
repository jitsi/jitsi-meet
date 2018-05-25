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

import android.annotation.TargetApi;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Module implementing a simple API to select the appropriate audio device for a
 * conference call.
 *
 * Audio calls should use {@code AudioModeModule.AUDIO_CALL}, which uses the
 * builtin earpiece, wired headset or bluetooth headset. The builtin earpiece is
 * the default audio device.
 *
 * Video calls should should use {@code AudioModeModule.VIDEO_CALL}, which uses
 * the builtin speaker, earpiece, wired headset or bluetooth headset. The
 * builtin speaker is the default audio device.
 *
 * Before a call has started and after it has ended the
 * {@code AudioModeModule.DEFAULT} mode should be used.
 */
class AudioModeModule extends ReactContextBaseJavaModule implements AudioManager.OnAudioFocusChangeListener {
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
     * Constant defining the action for plugging in a headset. This is used on
     * our device detection system for API < 23.
     */
    private static final String ACTION_HEADSET_PLUG
        = (Build.VERSION.SDK_INT >= 21)
            ? AudioManager.ACTION_HEADSET_PLUG
            : Intent.ACTION_HEADSET_PLUG;

    /**
     * Constant defining a USB headset. Only available on API level >= 26.
     * The value of: AudioDeviceInfo.TYPE_USB_HEADSET
     */
    private static final int TYPE_USB_HEADSET = 22;

    /**
     * The name of {@code AudioModeModule} to be used in the React Native
     * bridge.
     */
    private static final String MODULE_NAME = "AudioMode";

    /**
     * The {@code Log} tag {@code AudioModeModule} is to log messages with.
     */
    static final String TAG = MODULE_NAME;

    /**
     * Indicator that we have lost audio focus.
     */
    private boolean audioFocusLost = false;

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
     * {@link Runnable} for running audio device detection the main thread.
     * This is only used on Android >= M.
     */
    private final Runnable onAudioDeviceChangeRunner = new Runnable() {
        @TargetApi(Build.VERSION_CODES.M)
        @Override
        public void run() {
            Set<String> devices = new HashSet<>();
            AudioDeviceInfo[] deviceInfos
                = audioManager.getDevices(AudioManager.GET_DEVICES_ALL);

            for (AudioDeviceInfo info: deviceInfos) {
                switch (info.getType()) {
                case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
                    devices.add(DEVICE_BLUETOOTH);
                    break;
                case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
                    devices.add(DEVICE_EARPIECE);
                    break;
                case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
                    devices.add(DEVICE_SPEAKER);
                    break;
                case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
                case AudioDeviceInfo.TYPE_WIRED_HEADSET:
                case TYPE_USB_HEADSET:
                    devices.add(DEVICE_HEADPHONES);
                    break;
                }
            }

            availableDevices = devices;
            Log.d(TAG, "Available audio devices: " +
                availableDevices.toString());

            // Reset user selection
            userSelectedDevice = null;

            if (mode != -1) {
                updateAudioRoute(mode);
            }
        }
    };

    /**
     * {@link Runnable} for running update operation on the main thread.
     */
    private final Runnable updateAudioRouteRunner
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
     * Audio device types.
     */
    private static final String DEVICE_BLUETOOTH  = "BLUETOOTH";
    private static final String DEVICE_EARPIECE   = "EARPIECE";
    private static final String DEVICE_HEADPHONES = "HEADPHONES";
    private static final String DEVICE_SPEAKER    = "SPEAKER";

    /**
     * List of currently available audio devices.
     */
    private Set<String> availableDevices = new HashSet<>();

    /**
     * Currently selected device.
     */
    private String selectedDevice;

    /**
     * User selected device. When null the default is used depending on the
     * mode.
     */
    private String userSelectedDevice;

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

        // Do an initial detection on Android >= M.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            mainThreadHandler.post(onAudioDeviceChangeRunner);
        } else {
            // On Android < M, detect if we have an earpiece.
            PackageManager pm = reactContext.getPackageManager();
            if (pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
                availableDevices.add(DEVICE_EARPIECE);
            }

            // Always assume there is a speaker.
            availableDevices.add(DEVICE_SPEAKER);
        }
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
     * Gets the list of available audio device categories, i.e. 'bluetooth',
     * 'earpiece ', 'speaker', 'headphones'.
     *
     * @param promise a {@link Promise} which will be resolved with an object
     *                containing a 'devices' key with a list of devices, plus a
     *                'selected' key with the selected one.
     */
    @ReactMethod
    public void getAudioDevices(final Promise promise) {
        mainThreadHandler.post(new Runnable() {
            @Override
            public void run() {
                WritableMap map = Arguments.createMap();
                map.putString("selected", selectedDevice);
                WritableArray devices = Arguments.createArray();
                for (String device : availableDevices) {
                    if (mode == VIDEO_CALL && device.equals(DEVICE_EARPIECE)) {
                        // Skip earpiece when in video call mode.
                        continue;
                    }
                    devices.pushString(device);
                }
                map.putArray("devices", devices);

                promise.resolve(map);
            }
        });
    }

    /**
     * Gets the name for this module to be used in the React Native bridge.
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
     *
     * Only used on Android >= M.
     */
    void onAudioDeviceChange() {
        mainThreadHandler.post(onAudioDeviceChangeRunner);
    }

    /**
     * Helper method to trigger an audio route update when Bluetooth devices are
     * connected / disconnected.
     *
     * Only used on Android < M. Runs on the main thread.
     */
    void onBluetoothDeviceChange() {
        if (bluetoothHeadsetMonitor != null && bluetoothHeadsetMonitor.isHeadsetAvailable()) {
            availableDevices.add(DEVICE_BLUETOOTH);
        } else {
            availableDevices.remove(DEVICE_BLUETOOTH);
        }

        if (mode != -1) {
            updateAudioRoute(mode);
        }
    }

    /**
     * Helper method to trigger an audio route update when a headset is plugged
     * or unplugged.
     *
     * Only used on Android < M.
     */
    void onHeadsetDeviceChange() {
        mainThreadHandler.post(new Runnable() {
            @Override
            public void run() {
                // XXX: isWiredHeadsetOn is not deprecated when used just for
                // knowing if there is a wired headset connected, regardless of
                // audio being routed to it.
                //noinspection deprecation
                if (audioManager.isWiredHeadsetOn()) {
                    availableDevices.add(DEVICE_HEADPHONES);
                } else {
                    availableDevices.remove(DEVICE_HEADPHONES);
                }

                if (mode != -1) {
                    updateAudioRoute(mode);
                }
            }
        });
    }

    /**
     * {@link AudioManager.OnAudioFocusChangeListener} interface method. Called
     * when the audio focus of the system is updated.
     *
     * @param focusChange - The type of focus change.
     */
    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
        case AudioManager.AUDIOFOCUS_GAIN: {
            Log.d(TAG, "Audio focus gained");
            // Some other application potentially stole our audio focus
            // temporarily. Restore our mode.
            if (audioFocusLost) {
                updateAudioRoute(mode);
            }
            audioFocusLost = false;
            break;
        }
        case AudioManager.AUDIOFOCUS_LOSS:
        case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
        case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK: {
            Log.d(TAG, "Audio focus lost");
            audioFocusLost = true;
            break;
        }

        }
    }

    /**
     * Sets the user selected audio device as the active audio device.
     *
     * @param device the desired device which will become active.
     */
    @ReactMethod
    public void setAudioDevice(final String device) {
        mainThreadHandler.post(new Runnable() {
            @Override
            public void run() {
                if (!availableDevices.contains(device)) {
                    Log.d(TAG, "Audio device not available: " + device);
                    userSelectedDevice = null;
                    return;
                }

                if (mode != -1) {
                    Log.d(TAG, "User selected device set to: " + device);
                    userSelectedDevice = device;
                    updateAudioRoute(mode);
                }
            }
        });
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
                onHeadsetDeviceChange();
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
     * @return {@code true} if the audio route was updated successfully;
     * {@code false}, otherwise.
     */
    private boolean updateAudioRoute(int mode) {
        Log.d(TAG, "Update audio route for mode: " + mode);

        if (mode == DEFAULT) {
            audioFocusLost = false;
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.abandonAudioFocus(this);
            audioManager.setSpeakerphoneOn(false);
            setBluetoothAudioRoute(false);
            selectedDevice = null;
            userSelectedDevice = null;

            return true;
        }

        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.setMicrophoneMute(false);

        if (audioManager.requestAudioFocus(
                    this,
                    AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN)
                == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
            Log.d(TAG, "Audio focus request failed");
            return false;
        }

        boolean bluetoothAvailable = availableDevices.contains(DEVICE_BLUETOOTH);
        boolean earpieceAvailable = availableDevices.contains(DEVICE_EARPIECE);
        boolean headsetAvailable = availableDevices.contains(DEVICE_HEADPHONES);

        // Pick the desired device based on what's available and the mode.
        String audioDevice;
        if (bluetoothAvailable) {
            audioDevice = DEVICE_BLUETOOTH;
        } else if (headsetAvailable) {
            audioDevice = DEVICE_HEADPHONES;
        } else if (mode == AUDIO_CALL && earpieceAvailable) {
            audioDevice = DEVICE_EARPIECE;
        } else {
            audioDevice = DEVICE_SPEAKER;
        }

        // Consider the user's selection
        if (userSelectedDevice != null
                && availableDevices.contains(userSelectedDevice)) {
            audioDevice = userSelectedDevice;
        }

        // If the previously selected device and the current default one
        // match, do nothing.
        if (selectedDevice != null && selectedDevice.equals(audioDevice)) {
            return true;
        }

        selectedDevice = audioDevice;
        Log.d(TAG, "Selected audio device: " + audioDevice);

        // Turn bluetooth on / off
        setBluetoothAudioRoute(audioDevice.equals(DEVICE_BLUETOOTH));

        // Turn speaker on / off
        audioManager.setSpeakerphoneOn(audioDevice.equals(DEVICE_SPEAKER));

        return true;
    }
}
