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

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.util.Log;

/**
 * Helper class to detect and handle Bluetooth device changes.  It monitors
 * Bluetooth headsets being connected / disconnected and notifies the module
 * about device changes when this occurs.
 */
class BluetoothHeadsetMonitor {
    /**
     * {@link AudioModeModule} where this monitor reports.
     */
    private final AudioModeModule audioModeModule;

    /**
     * The {@link Context} in which {@link #audioModeModule} executes.
     */
    private final Context context;

    /**
     * Reference to a proxy object which allows us to query connected devices.
     */
    private BluetoothHeadset headset;

    /**
     * Flag indicating if there are any Bluetooth headset devices currently
     * available.
     */
    private boolean headsetAvailable = false;

    /**
     * Helper for running Bluetooth operations on the main thread.
     */
    private final Runnable updateDevicesRunnable
        = new Runnable() {
            @Override
            public void run() {
                headsetAvailable
                    = (headset != null)
                        && !headset.getConnectedDevices().isEmpty();
                audioModeModule.onBluetoothDeviceChange();
            }
        };

    public BluetoothHeadsetMonitor(
            AudioModeModule audioModeModule,
            Context context) {
        this.audioModeModule = audioModeModule;
        this.context = context;

        AudioManager audioManager
            = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        if (!audioManager.isBluetoothScoAvailableOffCall()) {
            Log.w(AudioModeModule.TAG, "Bluetooth SCO is not available");
            return;
        }

        if (getBluetoothHeadsetProfileProxy()) {
            registerBluetoothReceiver();

            // Initial detection.
            updateDevices();
        }
    }

    private boolean getBluetoothHeadsetProfileProxy() {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

        if (adapter == null) {
            Log.w(AudioModeModule.TAG, "Device doesn't support Bluetooth");
            return false;
        }

        // XXX: The profile listener listens for system services of the given
        // type being available to the application. That is, if our Bluetooth
        // adapter has the "headset" profile.
        BluetoothProfile.ServiceListener listener
            = new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(
                        int profile,
                        BluetoothProfile proxy) {
                    if (profile == BluetoothProfile.HEADSET) {
                        headset = (BluetoothHeadset) proxy;
                        updateDevices();
                    }
                }

                @Override
                public void onServiceDisconnected(int profile) {
                    // The logic is the same as the logic of onServiceConnected.
                    onServiceConnected(profile, /* proxy */ null);
                }
            };

        return
            adapter.getProfileProxy(
                    context,
                    listener,
                    BluetoothProfile.HEADSET);
    }

    /**
     * Returns the current headset availability.
     *
     * @return {@code true} if there is a Bluetooth headset connected;
     * {@code false}, otherwise.
     */
    public boolean isHeadsetAvailable() {
        return headsetAvailable;
    }

    private void onBluetoothReceiverReceive(Context context, Intent intent) {
        final String action = intent.getAction();

        if (action.equals(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)) {
            // XXX: This action will be fired when a Bluetooth headset is
            // connected or disconnected to the system. This is not related to
            // audio routing.
            int state = intent.getIntExtra(BluetoothHeadset.EXTRA_STATE, -99);

            switch (state) {
            case BluetoothHeadset.STATE_CONNECTED:
            case BluetoothHeadset.STATE_DISCONNECTED:
                Log.d(
                        AudioModeModule.TAG,
                        "BT headset connection state changed: " + state);
                updateDevices();
                break;
            }
        } else if (action.equals(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)) {
            // XXX: This action will be fired when the connection established
            // with a Bluetooth headset (called a SCO connection) changes state.
            // When the SCO connection is active we route audio to it.
            int state
                = intent.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, -99);

            switch (state) {
            case AudioManager.SCO_AUDIO_STATE_CONNECTED:
            case AudioManager.SCO_AUDIO_STATE_DISCONNECTED:
                Log.d(
                        AudioModeModule.TAG,
                        "BT SCO connection state changed: " + state);
                updateDevices();
                break;
            }
        }
    }

    private void registerBluetoothReceiver() {
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                onBluetoothReceiverReceive(context, intent);
            }
        };
        IntentFilter filter = new IntentFilter();

        filter.addAction(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED);
        filter.addAction(BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
        context.registerReceiver(receiver, filter);
    }

    /**
     * Detects if there are new devices connected / disconnected and fires the
     * {@link AudioModeModule#onAudioDeviceChange()} callback.
     */
    private void updateDevices() {
        audioModeModule.runInAudioThread(updateDevicesRunnable);
    }
}
