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

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * Helper class to detect and handle Bluetooth device changes.  It monitors
 * Bluetooth headsets being connected / disconnected and notifies the module
 * about device changes when this occurs.
 */
class BluetoothHeadsetMonitor {
    private final static String TAG = BluetoothHeadsetMonitor.class.getSimpleName();

    /**
     * The {@link Context} in which this module executes.
     */
    private final Context context;

    /**
     * Reference to the {@link BluetoothAdapter} object, used to access Bluetooth functionality.
     */
    private BluetoothAdapter adapter;

    /**
     * Reference to a proxy object which allows us to query connected devices.
     */
    private BluetoothHeadset headset;

    /**
     * receiver registered for receiving Bluetooth connection state changes.
     */
    private BroadcastReceiver receiver;

    /**
     * Listener for receiving Bluetooth device change events.
     */
    private Listener listener;

    public BluetoothHeadsetMonitor(Context context, Listener listener) {
        this.context = context;
        this.listener = listener;
    }

    private boolean getBluetoothHeadsetProfileProxy() {
        adapter = BluetoothAdapter.getDefaultAdapter();

        if (adapter == null) {
            JitsiMeetLogger.w(TAG + " Device doesn't support Bluetooth");
            return false;
        }

        // XXX: The profile listener listens for system services of the given
        // type being available to the application. That is, if our Bluetooth
        // adapter has the "headset" profile.
        BluetoothProfile.ServiceListener listener
            = new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(int profile, BluetoothProfile proxy) {
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

        return adapter.getProfileProxy(context, listener, BluetoothProfile.HEADSET);
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
                JitsiMeetLogger.d(TAG + " BT headset connection state changed: " + state);
                updateDevices();
                break;
            }
        } else if (action.equals(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)) {
            // XXX: This action will be fired when the connection established
            // with a Bluetooth headset (called a SCO connection) changes state.
            // When the SCO connection is active we route audio to it.
            int state = intent.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, -99);

            switch (state) {
            case AudioManager.SCO_AUDIO_STATE_CONNECTED:
            case AudioManager.SCO_AUDIO_STATE_DISCONNECTED:
                JitsiMeetLogger.d(TAG + " BT SCO connection state changed: " + state);
                updateDevices();
                break;
            }
        }
    }

    private void registerBluetoothReceiver() {
        receiver = new BroadcastReceiver() {
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
     * {@link Listener} registered event.
     */
    private void updateDevices() {
        boolean headsetAvailable = (headset != null) && !headset.getConnectedDevices().isEmpty();
        listener.onBluetoothDeviceChange(headsetAvailable);
    }

    public void start() {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        if (!audioManager.isBluetoothScoAvailableOffCall()) {
            JitsiMeetLogger.w(TAG + " Bluetooth SCO is not available");
            return;
        }

        if (!getBluetoothHeadsetProfileProxy()) {
            JitsiMeetLogger.w(TAG + " Couldn't get BT profile proxy");
            return;
        }

        registerBluetoothReceiver();

        // Initial detection.
        updateDevices();
    }

    public void stop() {
        if (receiver != null) {
            context.unregisterReceiver(receiver);
        }

        if (adapter != null && headset != null) {
            adapter.closeProfileProxy(BluetoothProfile.HEADSET, headset);
        }

        receiver = null;
        headset = null;
        adapter = null;
    }

    interface Listener {
        void onBluetoothDeviceChange(boolean deviceAvailable);
    }
}
