package org.jitsi.meet.audiomode;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.ReactContext;

import java.util.List;

/**
 * Helper class to detect and handle Bluetooth device changes.  It monitors
 * Bluetooth headsets being connected / disconnected and notifies the module
 * about device changes when this occurs.
 */
public class BluetoothHeadsetMonitor {
    /**
     * {@link AudioManager} instance used to interact with the Android audio
     * subsystem.
     */
    private final AudioManager audioManager;

    /**
     * {@link AudioModeModule} where this monitor reports.
     */
    private final AudioModeModule audioModeModule;

    /**
     * Reference to the Bluetooth adapter, needed for managing
     * <tt>BluetoothProfile.HEADSET</tt> devices.
     */
    private BluetoothAdapter bluetoothAdapter;

    /**
     * Reference to a proxy object which allows us to query connected devices.
     */
    private BluetoothHeadset bluetoothHeadset;

    /**
     * Listener for Bluetooth service profiles, allows us to get the proxy
     * object to {@link BluetoothHeadset}.
     */
    private BluetoothProfile.ServiceListener bluetoothProfileListener;

    /**
     * Helper for running Bluetooth operations on the main thread.
     */
    private Runnable bluetoothRunnable;

    /**
     * Flag indicating if there are any Bluetooth headset devices currently
     * available.
     */
    private boolean headsetAvailable = false;

    /**
     * {@link Handler} for running all operations on the main thread.
     */
    private final Handler mainThreadHandler;

    /**
     * {@link ReactContext} instance where the main module runs.
     */
    private final ReactContext reactContext;

    public BluetoothHeadsetMonitor(
            AudioModeModule audioModeModule,
            ReactContext reactContext) {
        this.audioModeModule = audioModeModule;
        this.reactContext = reactContext;

        audioManager
            = (AudioManager)
                reactContext.getSystemService(Context.AUDIO_SERVICE);
        bluetoothAdapter = null;
        bluetoothHeadset = null;
        bluetoothProfileListener = null;
        mainThreadHandler = new Handler(Looper.getMainLooper());
    }

    /**
     * Returns the current headset availability.
     *
     * @return true if there is a Bluetooth headset connected, false otherwise.
     */
    public boolean isHeadsetAvailable() {
        return headsetAvailable;
    }

    /**
     * Start monitoring Bluetooth device activity.
     */
    public void start() {
        bluetoothRunnable = new Runnable() {
            @Override
            public void run() {
                if (bluetoothHeadset == null) {
                    headsetAvailable = false;
                } else {
                    List<BluetoothDevice> devices
                        = bluetoothHeadset.getConnectedDevices();
                    headsetAvailable = !devices.isEmpty();
                }
                audioModeModule.onAudioDeviceChange();
            }
        };

        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            Log.w(AudioModeModule.TAG, "Device doesn't support Bluetooth");
            return;
        }

        if (!audioManager.isBluetoothScoAvailableOffCall()) {
            Log.w(AudioModeModule.TAG, "Bluetooth SCO is not available");
            return;
        }

        // XXX: The profile listener listens for system services of the given
        // type being available to the application. That is, if our Bluetooth
        // adapter has the "headset" profile.
        bluetoothProfileListener = new BluetoothProfile.ServiceListener() {
            @Override
            public void onServiceConnected(
                    int profile,
                    BluetoothProfile proxy) {
                if (profile == BluetoothProfile.HEADSET) {
                    bluetoothHeadset = (BluetoothHeadset) proxy;
                    updateDevices();
                }
            }

            @Override
            public void onServiceDisconnected(int profile) {
                if (profile == BluetoothProfile.HEADSET) {
                    bluetoothHeadset = null;
                    updateDevices();
                }
            }
        };

        bluetoothAdapter.getProfileProxy(reactContext,
                bluetoothProfileListener, BluetoothProfile.HEADSET);

        IntentFilter bluetoothFilter = new IntentFilter();
        bluetoothFilter.addAction(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED);
        bluetoothFilter.addAction(
                BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
        BroadcastReceiver bluetoothReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                final String action = intent.getAction();
                if (action.equals(
                        BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED)) {
                    // XXX: This action will be fired when a Bluetooth headset
                    // is connected or disconnected to the system. This is not
                    // related to audio routing.
                    final int state
                        = intent.getIntExtra(BluetoothHeadset.EXTRA_STATE, -99);
                    switch (state) {
                    case BluetoothHeadset.STATE_CONNECTED:
                    case BluetoothHeadset.STATE_DISCONNECTED:
                        Log.d(
                                AudioModeModule.TAG,
                                "BT headset connection state changed: "
                                    + state);
                        updateDevices();
                        break;
                    default:
                        break;
                    }
                } else if (action.equals(
                        AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)) {
                    // XXX: This action will be fired when the connection
                    // established with a Bluetooth headset (called a SCO
                    // connection) changes state.  When the SCO connection is
                    // active we route audio to it.
                    final int state
                        = intent.getIntExtra(
                                AudioManager.EXTRA_SCO_AUDIO_STATE,
                                -99);
                    switch (state) {
                    case AudioManager.SCO_AUDIO_STATE_CONNECTED:
                    case AudioManager.SCO_AUDIO_STATE_DISCONNECTED:
                        Log.d(
                                AudioModeModule.TAG,
                                "BT SCO connection state changed: " + state);
                        updateDevices();
                        break;
                    default:
                        break;
                    }
                }
            }
        };
        reactContext.registerReceiver(bluetoothReceiver, bluetoothFilter);

        // Initial detection.
        updateDevices();
    }

    /**
     * Detects if there are new devices connected / disconnected and fires the
     * {@link AudioModeModule#onAudioDeviceChange()} callback.
     */
    private void updateDevices() {
        mainThreadHandler.post(bluetoothRunnable);
    }
}
