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
import android.os.Build;
import androidx.annotation.RequiresApi;

import java.util.HashSet;
import java.util.Set;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


/**
 * {@link AudioModeModule.AudioDeviceHandlerInterface} module implementing device handling for
 * Android versions >= O when ConnectionService is enabled.
 */
@RequiresApi(Build.VERSION_CODES.O)
class AudioDeviceHandlerConnectionService implements
        AudioModeModule.AudioDeviceHandlerInterface,
        RNConnectionService.CallAudioStateListener {

    private final static String TAG = AudioDeviceHandlerConnectionService.class.getSimpleName();

    /**
     * Reference to the main {@code AudioModeModule}.
     */
    private AudioModeModule module;

    /**
     * Converts any of the "DEVICE_" constants into the corresponding
     * {@link android.telecom.CallAudioState} "ROUTE_" number.
     *
     * @param audioDevice one of the "DEVICE_" constants.
     * @return a route number {@link android.telecom.CallAudioState#ROUTE_EARPIECE} if
     * no match is found.
     */
    private static int audioDeviceToRouteInt(String audioDevice) {
        if (audioDevice == null) {
            return android.telecom.CallAudioState.ROUTE_EARPIECE;
        }
        switch (audioDevice) {
            case AudioModeModule.DEVICE_BLUETOOTH:
                return android.telecom.CallAudioState.ROUTE_BLUETOOTH;
            case AudioModeModule.DEVICE_EARPIECE:
                return android.telecom.CallAudioState.ROUTE_EARPIECE;
            case AudioModeModule.DEVICE_HEADPHONES:
                return android.telecom.CallAudioState.ROUTE_WIRED_HEADSET;
            case AudioModeModule.DEVICE_SPEAKER:
                return android.telecom.CallAudioState.ROUTE_SPEAKER;
            default:
                JitsiMeetLogger.e(TAG + " Unsupported device name: " + audioDevice);
                return android.telecom.CallAudioState.ROUTE_EARPIECE;
        }
    }

    /**
     * Populates given route mask into the "DEVICE_" list.
     *
     * @param supportedRouteMask an integer coming from
     * {@link android.telecom.CallAudioState#getSupportedRouteMask()}.
     * @return a list of device names.
     */
    private static Set<String> routesToDeviceNames(int supportedRouteMask) {
        Set<String> devices = new HashSet<>();
        if ((supportedRouteMask & android.telecom.CallAudioState.ROUTE_EARPIECE)
                == android.telecom.CallAudioState.ROUTE_EARPIECE) {
            devices.add(AudioModeModule.DEVICE_EARPIECE);
        }
        if ((supportedRouteMask & android.telecom.CallAudioState.ROUTE_BLUETOOTH)
                == android.telecom.CallAudioState.ROUTE_BLUETOOTH) {
            devices.add(AudioModeModule.DEVICE_BLUETOOTH);
        }
        if ((supportedRouteMask & android.telecom.CallAudioState.ROUTE_SPEAKER)
                == android.telecom.CallAudioState.ROUTE_SPEAKER) {
            devices.add(AudioModeModule.DEVICE_SPEAKER);
        }
        if ((supportedRouteMask & android.telecom.CallAudioState.ROUTE_WIRED_HEADSET)
                == android.telecom.CallAudioState.ROUTE_WIRED_HEADSET) {
            devices.add(AudioModeModule.DEVICE_HEADPHONES);
        }
        return devices;
    }

    /**
     * Used to store the most recently reported audio devices.
     * Makes it easier to compare for a change, because the devices are stored
     * as a mask in the {@link android.telecom.CallAudioState}. The mask is populated into
     * the {@code availableDevices} on each update.
     */
    private int supportedRouteMask = -1;

    public AudioDeviceHandlerConnectionService() {
    }

    @Override
    public void onCallAudioStateChange(final android.telecom.CallAudioState callAudioState) {
        module.runInAudioThread(new Runnable() {
            @Override
            public void run() {
                boolean audioRouteChanged
                    = audioDeviceToRouteInt(module.getSelectedDevice()) != callAudioState.getRoute();
                int newSupportedRoutes = callAudioState.getSupportedRouteMask();
                boolean audioDevicesChanged = supportedRouteMask != newSupportedRoutes;
                if (audioDevicesChanged) {
                    supportedRouteMask = newSupportedRoutes;
                    Set<String> devices = routesToDeviceNames(supportedRouteMask);
                    module.replaceDevices(devices);
                    JitsiMeetLogger.i(TAG + " Available audio devices: " + devices.toString());
                }

                if (audioRouteChanged || audioDevicesChanged) {
                    module.resetSelectedDevice();
                    module.updateAudioRoute();
                }
            }
        });
    }

    @Override
    public void start(Context context, AudioModeModule audioModeModule) {
        JitsiMeetLogger.i("Using " + TAG + " as the audio device handler");

        module = audioModeModule;
        RNConnectionService rcs = ReactInstanceManagerHolder.getNativeModule(RNConnectionService.class);
        if (rcs != null) {
            rcs.setCallAudioStateListener(this);
        }
    }

    @Override
    public void stop() {
        RNConnectionService rcs = ReactInstanceManagerHolder.getNativeModule(RNConnectionService.class);
        if (rcs != null) {
            rcs.setCallAudioStateListener(null);
        }
    }

    public void setAudioRoute(String audioDevice) {
        int newAudioRoute = audioDeviceToRouteInt(audioDevice);

        RNConnectionService.setAudioRoute(newAudioRoute);
    }

    @Override
    public boolean setMode(int mode) {
        return true;
    }
}
