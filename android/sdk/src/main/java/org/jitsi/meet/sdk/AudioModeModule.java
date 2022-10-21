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

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.os.Build;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

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
@SuppressLint("AnnotateVersionCheck")
@ReactModule(name = AudioModeModule.NAME)
class AudioModeModule extends ReactContextBaseJavaModule {
    public static final String NAME = "AudioMode";

    /**
     * Constants representing the audio mode.
     * - DEFAULT: Used before and after every call. It represents the default
     *   audio routing scheme.
     * - AUDIO_CALL: Used for audio only calls. It will use the earpiece by
     *   default, unless a wired or Bluetooth headset is connected.
     * - VIDEO_CALL: Used for video calls. It will use the speaker by default,
     *   unless a wired or Bluetooth headset is connected.
     */
    static final int DEFAULT    = 0;
    static final int AUDIO_CALL = 1;
    static final int VIDEO_CALL = 2;

    /**
     * The {@code Log} tag {@code AudioModeModule} is to log messages with.
     */
    static final String TAG = NAME;

    /**
     * Whether or not the ConnectionService is used for selecting audio devices.
     */
    private static final boolean supportsConnectionService = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    private static boolean useConnectionService_ = supportsConnectionService;

    static boolean useConnectionService() {
        return supportsConnectionService && useConnectionService_;
    }

    /**
     * {@link AudioManager} instance used to interact with the Android audio
     * subsystem.
     */
    private AudioManager audioManager;

    private AudioDeviceHandlerInterface audioDeviceHandler;

    /**
     * {@link ExecutorService} for running all audio operations on a dedicated
     * thread.
     */
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    /**
     * Audio mode currently in use.
     */
    private int mode = -1;

    /**
     * Audio device types.
     */
    static final String DEVICE_BLUETOOTH  = "BLUETOOTH";
    static final String DEVICE_EARPIECE   = "EARPIECE";
    static final String DEVICE_HEADPHONES = "HEADPHONES";
    static final String DEVICE_SPEAKER    = "SPEAKER";

    /**
     * Device change event.
     */
    private static final String DEVICE_CHANGE_EVENT = "org.jitsi.meet:features/audio-mode#devices-update";

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

        audioManager = (AudioManager)reactContext.getSystemService(Context.AUDIO_SERVICE);
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
     * Gets a mapping with the constants this module is exporting.
     *
     * @return a {@link Map} mapping the constants to be exported with their
     * values.
     */
    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = new HashMap<>();

        constants.put("DEVICE_CHANGE_EVENT", DEVICE_CHANGE_EVENT);
        constants.put("AUDIO_CALL", AUDIO_CALL);
        constants.put("DEFAULT", DEFAULT);
        constants.put("VIDEO_CALL", VIDEO_CALL);

        return constants;
    }

    /**
     * Notifies JS land that the devices list has changed.
     */
    private void notifyDevicesChanged() {
        runInAudioThread(new Runnable() {
            @Override
            public void run() {
                WritableArray data = Arguments.createArray();
                final boolean hasHeadphones = availableDevices.contains(DEVICE_HEADPHONES);
                for (String device : availableDevices) {
                    if (hasHeadphones && device.equals(DEVICE_EARPIECE)) {
                        // Skip earpiece when headphones are plugged in.
                        continue;
                    }
                    WritableMap deviceInfo = Arguments.createMap();
                    deviceInfo.putString("type", device);
                    deviceInfo.putBoolean("selected", device.equals(selectedDevice));
                    data.pushMap(deviceInfo);
                }
                ReactInstanceManagerHolder.emitEvent(DEVICE_CHANGE_EVENT, data);
                JitsiMeetLogger.i(TAG + " Updating audio device list");
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
        return NAME;
    }

    /**
     * Initializes the audio device handler module. This function is called *after* all Catalyst
     * modules have been created, and that's why we use it, because {@link AudioDeviceHandlerConnectionService}
     * needs access to another Catalyst module, so doing this in the constructor would be too early.
     */
    @Override
    public void initialize() {
        runInAudioThread(new Runnable() {
            @Override
            public void run() {
                setAudioDeviceHandler();
            }
        });
    }

    private void setAudioDeviceHandler() {
        if (audioDeviceHandler != null) {
            audioDeviceHandler.stop();
        }

        if (useConnectionService()) {
            audioDeviceHandler = new AudioDeviceHandlerConnectionService(audioManager);
        } else {
            audioDeviceHandler = new AudioDeviceHandlerGeneric(audioManager);
        }

        audioDeviceHandler.start(this);
    }

    /**
     * Helper function to run operations on a dedicated thread.
     * @param runnable
     */
    void runInAudioThread(Runnable runnable) {
        executor.execute(runnable);
    }

    /**
     * Sets the user selected audio device as the active audio device.
     *
     * @param device the desired device which will become active.
     */
    @ReactMethod
    public void setAudioDevice(final String device) {
        runInAudioThread(new Runnable() {
            @Override
            public void run() {
                if (!availableDevices.contains(device)) {
                    JitsiMeetLogger.w(TAG + " Audio device not available: " + device);
                    userSelectedDevice = null;
                    return;
                }

                if (mode != -1) {
                    JitsiMeetLogger.i(TAG + " User selected device set to: " + device);
                    userSelectedDevice = device;
                    updateAudioRoute(mode, false);
                }
            }
        });
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

        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            if (mode == DEFAULT) {
                currentActivity.setVolumeControlStream(AudioManager.USE_DEFAULT_STREAM_TYPE);
            } else {
                currentActivity.setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);
            }
        }

        runInAudioThread(new Runnable() {
            @Override
            public void run() {
                boolean success;

                try {
                    success = updateAudioRoute(mode, false);
                } catch (Throwable e) {
                    success = false;
                    JitsiMeetLogger.e(e, TAG + " Failed to update audio route for mode: " + mode);
                }
                if (success) {
                    AudioModeModule.this.mode = mode;
                    promise.resolve(null);
                } else {
                    promise.reject("setMode", "Failed to set audio mode to " + mode);
                }
            }
        });
    }

    /**
     * Sets whether ConnectionService should be used (if available) for setting the audio mode
     * or not.
     *
     * @param use Boolean indicator of where it should be used or not.
     */
    @ReactMethod
    public void setUseConnectionService(final boolean use) {
        runInAudioThread(new Runnable() {
            @Override
            public void run() {
                useConnectionService_ = use;
                setAudioDeviceHandler();
            }
        });
    }

    /**
     * Updates the audio route for the given mode.
     *
     * @param mode the audio mode to be used when computing the audio route.
     * @return {@code true} if the audio route was updated successfully;
     * {@code false}, otherwise.
     */
    private boolean updateAudioRoute(int mode, boolean force) {
        JitsiMeetLogger.i(TAG + " Update audio route for mode: " + mode);

        if (!audioDeviceHandler.setMode(mode)) {
            return false;
        }

        if (mode == DEFAULT) {
            selectedDevice = null;
            userSelectedDevice = null;

            notifyDevicesChanged();
            return true;
        }

        boolean bluetoothAvailable = availableDevices.contains(DEVICE_BLUETOOTH);
        boolean headsetAvailable = availableDevices.contains(DEVICE_HEADPHONES);

        // Pick the desired device based on what's available and the mode.
        String audioDevice;
        if (bluetoothAvailable) {
            audioDevice = DEVICE_BLUETOOTH;
        } else if (headsetAvailable) {
            audioDevice = DEVICE_HEADPHONES;
        } else {
            audioDevice = DEVICE_SPEAKER;
        }

        // Consider the user's selection
        if (userSelectedDevice != null && availableDevices.contains(userSelectedDevice)) {
            audioDevice = userSelectedDevice;
        }

        // If the previously selected device and the current default one
        // match, do nothing.
        if (!force && selectedDevice != null && selectedDevice.equals(audioDevice)) {
            return true;
        }

        selectedDevice = audioDevice;
        JitsiMeetLogger.i(TAG + " Selected audio device: " + audioDevice);

        audioDeviceHandler.setAudioRoute(audioDevice);

        notifyDevicesChanged();
        return true;
    }

    /**
     * Gets the currently selected audio device.
     *
     * @return The selected audio device.
     */
    String getSelectedDevice() {
        return selectedDevice;
    }

    /**
     * Resets the current device selection.
     */
    void resetSelectedDevice() {
        selectedDevice = null;
        userSelectedDevice = null;
    }

    /**
     * Adds a new device to the list of available devices.
     *
     * @param device The new device.
     */
    void addDevice(String device) {
        availableDevices.add(device);
        resetSelectedDevice();
    }

    /**
     * Removes a device from the list of available devices.
     *
     * @param device The old device to the removed.
     */
    void removeDevice(String device) {
        availableDevices.remove(device);
        resetSelectedDevice();
    }

    /**
     * Replaces the current list of available devices with a new one.
     *
     * @param devices The new devices list.
     */
    void replaceDevices(Set<String> devices) {
        availableDevices = devices;
        resetSelectedDevice();
    }

    /**
     * Re-sets the current audio route. Needed when devices changes have happened.
     */
    void updateAudioRoute() {
        if (mode != -1) {
            updateAudioRoute(mode, false);
        }
    }

    /**
     * Re-sets the current audio route. Needed when focus is lost and regained.
     */
    void resetAudioRoute() {
        if (mode != -1) {
            updateAudioRoute(mode, true);
        }
    }

    /**
     * Interface for the modules implementing the actual audio device management.
     */
    interface AudioDeviceHandlerInterface {
        /**
         * Start detecting audio device changes.
         * @param audioModeModule Reference to the main {@link AudioModeModule}.
         */
        void start(AudioModeModule audioModeModule);

        /**
         * Stop audio device detection.
         */
        void stop();

        /**
         * Set the appropriate route for the given audio device.
         *
         * @param device Audio device for which the route must be set.
         */
        void setAudioRoute(String device);

        /**
         * Set the given audio mode.
         *
         * @param mode The new audio mode to be used.
         * @return Whether the operation was successful or not.
         */
        boolean setMode(int mode);
    }
}
