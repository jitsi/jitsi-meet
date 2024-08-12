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

import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;

import java.util.HashSet;
import java.util.Set;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


/**
 * {@link AudioModeModule.AudioDeviceHandlerInterface} module implementing device handling for
 * all post-M Android versions. This handler can be used on any Android versions >= M, but by
 * default it's only used on versions < O, since versions >= O use ConnectionService, but it
 * can be disabled.
 */
class AudioDeviceHandlerGeneric implements
        AudioModeModule.AudioDeviceHandlerInterface,
        AudioManager.OnAudioFocusChangeListener {

    private final static String TAG = AudioDeviceHandlerGeneric.class.getSimpleName();

    /**
     * Reference to the main {@code AudioModeModule}.
     */
    private AudioModeModule module;

    /**
     * Constant defining a Hearing Aid. Only available on API level >= 28.
     * The value of: AudioDeviceInfo.TYPE_HEARING_AID
     */
    private static final int TYPE_HEARING_AID = 23;

    /**
     * Constant defining a USB headset. Only available on API level >= 26.
     * The value of: AudioDeviceInfo.TYPE_USB_HEADSET
     */
    private static final int TYPE_USB_HEADSET = 22;

    /**
     * Indicator that we have lost audio focus.
     */
    private boolean audioFocusLost = false;

    /**
     * {@link AudioManager} instance used to interact with the Android audio
     * subsystem.
     */
    private AudioManager audioManager;

    /**
     * {@link Runnable} for running audio device detection in the audio thread.
     * This is only used on Android >= M.
     */
    private final Runnable onAudioDeviceChangeRunner = new Runnable() {
        @Override
        public void run() {
            Set<String> devices = new HashSet<>();
            AudioDeviceInfo[] deviceInfos = audioManager.getDevices(AudioManager.GET_DEVICES_ALL);

            for (AudioDeviceInfo info: deviceInfos) {
                switch (info.getType()) {
                    case AudioDeviceInfo.TYPE_BLUETOOTH_SCO:
                        devices.add(AudioModeModule.DEVICE_BLUETOOTH);
                        break;
                    case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE:
                        devices.add(AudioModeModule.DEVICE_EARPIECE);
                        break;
                    case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER:
                    case AudioDeviceInfo.TYPE_HDMI:
                        devices.add(AudioModeModule.DEVICE_SPEAKER);
                        break;
                    case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
                    case AudioDeviceInfo.TYPE_WIRED_HEADSET:
                    case TYPE_HEARING_AID:
                    case TYPE_USB_HEADSET:
                        devices.add(AudioModeModule.DEVICE_HEADPHONES);
                        break;
                }
            }

            module.replaceDevices(devices);

            JitsiMeetLogger.i(TAG + " Available audio devices: " + devices.toString());

            module.updateAudioRoute();
        }
    };

    private final android.media.AudioDeviceCallback audioDeviceCallback =
        new android.media.AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(
                AudioDeviceInfo[] addedDevices) {
                JitsiMeetLogger.d(TAG + " Audio devices added");
                onAudioDeviceChange();
            }

            @Override
            public void onAudioDevicesRemoved(
                AudioDeviceInfo[] removedDevices) {
                JitsiMeetLogger.d(TAG + " Audio devices removed");
                onAudioDeviceChange();
            }
        };

    public AudioDeviceHandlerGeneric(AudioManager audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Helper method to trigger an audio route update when devices change. It
     * makes sure the operation is performed on the audio thread.
     */
    private void onAudioDeviceChange() {
        module.runInAudioThread(onAudioDeviceChangeRunner);
    }

    /**
     * {@link AudioManager.OnAudioFocusChangeListener} interface method. Called
     * when the audio focus of the system is updated.
     *
     * @param focusChange - The type of focus change.
     */
    @Override
    public void onAudioFocusChange(final int focusChange) {
        module.runInAudioThread(new Runnable() {
            @Override
            public void run() {
                switch (focusChange) {
                    case AudioManager.AUDIOFOCUS_GAIN: {
                        JitsiMeetLogger.d(TAG + " Audio focus gained");
                        // Some other application potentially stole our audio focus
                        // temporarily. Restore our mode.
                        if (audioFocusLost) {
                            module.resetAudioRoute();
                        }
                        audioFocusLost = false;
                        break;
                    }
                    case AudioManager.AUDIOFOCUS_LOSS:
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK: {
                        JitsiMeetLogger.d(TAG + " Audio focus lost");
                        audioFocusLost = true;
                        break;
                    }
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

    @Override
    public void start(AudioModeModule audioModeModule) {
        JitsiMeetLogger.i("Using " + TAG + " as the audio device handler");

        module = audioModeModule;

        // Setup runtime device change detection.
        audioManager.registerAudioDeviceCallback(audioDeviceCallback, null);

        // Do an initial detection.
        onAudioDeviceChange();
    }

    @Override
    public void stop() {
        audioManager.unregisterAudioDeviceCallback(audioDeviceCallback);
    }

    @Override
    public void setAudioRoute(String device) {
        // Turn speaker on / off
        audioManager.setSpeakerphoneOn(device.equals(AudioModeModule.DEVICE_SPEAKER));

        // Turn bluetooth on / off
        setBluetoothAudioRoute(device.equals(AudioModeModule.DEVICE_BLUETOOTH));
    }

    @Override
    public boolean setMode(int mode) {
        if (mode == AudioModeModule.DEFAULT) {
            audioFocusLost = false;
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.abandonAudioFocus(this);
            audioManager.setSpeakerphoneOn(false);
            setBluetoothAudioRoute(false);

            return true;
        }

        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.setMicrophoneMute(false);

        int gotFocus;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            gotFocus = audioManager.requestAudioFocus(new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(this)
                .build()
            );
        } else {
            gotFocus = audioManager.requestAudioFocus(this, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN);
        }

        if (gotFocus == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
            JitsiMeetLogger.w(TAG + " Audio focus request failed");
            return false;
        }

        return true;
    }
}
