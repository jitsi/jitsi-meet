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

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioManager;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


/**
 * {@link AudioModeModule.AudioDeviceHandlerInterface} module implementing device handling for
 * legacy (pre-M) Android versions.
 */
class AudioDeviceHandlerLegacy implements
        AudioModeModule.AudioDeviceHandlerInterface,
        AudioManager.OnAudioFocusChangeListener,
        BluetoothHeadsetMonitor.Listener {

    private final static String TAG = AudioDeviceHandlerLegacy.class.getSimpleName();

    /**
     * Reference to the main {@code AudioModeModule}.
     */
    private AudioModeModule module;

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
     * {@link BluetoothHeadsetMonitor} for detecting Bluetooth device changes in
     * old (< M) Android versions.
     */
    private BluetoothHeadsetMonitor bluetoothHeadsetMonitor;

    public AudioDeviceHandlerLegacy(AudioManager audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Helper method to trigger an audio route update when Bluetooth devices are
     * connected / disconnected.
     */
    @Override
    public void onBluetoothDeviceChange(final boolean deviceAvailable) {
        module.runInAudioThread(new Runnable() {
            @Override
            public void run() {
                if (deviceAvailable) {
                    module.addDevice(AudioModeModule.DEVICE_BLUETOOTH);
                } else {
                    module.removeDevice(AudioModeModule.DEVICE_BLUETOOTH);
                }

                module.updateAudioRoute();
            }
        });
    }

    /**
     * Helper method to trigger an audio route update when a headset is plugged
     * or unplugged.
     */
    private void onHeadsetDeviceChange() {
        module.runInAudioThread(new Runnable() {
            @Override
            public void run() {
                // XXX: isWiredHeadsetOn is not deprecated when used just for
                // knowing if there is a wired headset connected, regardless of
                // audio being routed to it.
                //noinspection deprecation
                if (audioManager.isWiredHeadsetOn()) {
                    module.addDevice(AudioModeModule.DEVICE_HEADPHONES);
                } else {
                    module.removeDevice(AudioModeModule.DEVICE_HEADPHONES);
                }

                module.updateAudioRoute();
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
                            module.updateAudioRoute();
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
        Context context = module.getContext();

        // Setup runtime device change detection.
        //

        // Detect changes in wired headset connections.
        IntentFilter wiredHeadSetFilter = new IntentFilter(AudioManager.ACTION_HEADSET_PLUG);
        BroadcastReceiver wiredHeadsetReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JitsiMeetLogger.d(TAG + " Wired headset added / removed");
                onHeadsetDeviceChange();
            }
        };
        context.registerReceiver(wiredHeadsetReceiver, wiredHeadSetFilter);

        // Detect Bluetooth device changes.
        bluetoothHeadsetMonitor = new BluetoothHeadsetMonitor(context, this);

        // On Android < M, detect if we have an earpiece.
        PackageManager pm = context.getPackageManager();
        if (pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
            module.addDevice(AudioModeModule.DEVICE_EARPIECE);
        }

        // Always assume there is a speaker.
        module.addDevice(AudioModeModule.DEVICE_SPEAKER);
    }

    @Override
    public void stop() {
        bluetoothHeadsetMonitor.stop();
        bluetoothHeadsetMonitor = null;
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

        if (audioManager.requestAudioFocus(this, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN)
                == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
            JitsiMeetLogger.w(TAG + " Audio focus request failed");
            return false;
        }

        return true;
    }
}
