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

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Enumeration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Module exposing WiFi statistics.
 *
 * Gathers rssi, signal in percentage, timestamp and the addresses of the wifi
 * device.
 */
@ReactModule(name = WiFiStatsModule.NAME)
class WiFiStatsModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "WiFiStats";

    /**
     * The {@code Log} tag {@code WiFiStatsModule} is to log messages with.
     */
    static final String TAG = NAME;

    /**
     * The scale used for the signal value. A level of the signal, given in the
     * range of 0 to SIGNAL_LEVEL_SCALE-1 (both inclusive).
     */
    public final static int SIGNAL_LEVEL_SCALE = 101;

    /**
     * {@link ExecutorService} for running all operations on a dedicated thread.
     */
    private static final ExecutorService executor
        = Executors.newSingleThreadExecutor();

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext the {@link ReactApplicationContext} where this module
     * is created.
     */
    public WiFiStatsModule(ReactApplicationContext reactContext) {
        super(reactContext);
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
     * Returns the {@link InetAddress} represented by this int.
     *
     * @param value the int representation of the ip address.
     * @return the {@link InetAddress}.
     * @throws UnknownHostException - if IP address is of illegal length.
     */
    public static InetAddress toInetAddress(int value)
            throws UnknownHostException {
        return InetAddress.getByAddress(
            new byte[] {
                    (byte) value,
                    (byte) (value >> 8),
                    (byte) (value >> 16),
                    (byte) (value >> 24)
            });
    }

    /**
     * Public method to retrieve WiFi stats.
     *
     * @param promise a {@link Promise} which will be resolved if WiFi stats are
     * retrieved successfully, and it will be rejected otherwise.
     */
    @ReactMethod
    public void getWiFiStats(final Promise promise) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                try {
                    Context context
                        = getReactApplicationContext().getApplicationContext();
                    WifiManager wifiManager
                        = (WifiManager) context
                            .getSystemService(Context.WIFI_SERVICE);

                    if (!wifiManager.isWifiEnabled()) {
                        promise.reject(new Exception("Wifi not enabled"));
                        return;
                    }

                    WifiInfo wifiInfo = wifiManager.getConnectionInfo();

                    if (wifiInfo.getNetworkId() == -1) {
                        promise.reject(new Exception("Wifi not connected"));
                        return;
                    }

                    int rssi = wifiInfo.getRssi();
                    int signalLevel
                        = WifiManager.calculateSignalLevel(
                            rssi, SIGNAL_LEVEL_SCALE);

                    JSONObject result = new JSONObject();
                    result.put("rssi", rssi)
                        .put("signal", signalLevel)
                        .put("timestamp", System.currentTimeMillis());

                    JSONArray addresses = new JSONArray();

                    InetAddress wifiAddress
                        = toInetAddress(wifiInfo.getIpAddress());

                    try {
                        Enumeration<NetworkInterface> e
                            =  NetworkInterface.getNetworkInterfaces();
                        while (e.hasMoreElements()) {
                            NetworkInterface networkInterface = e.nextElement();
                            boolean found = false;

                            // first check whether this is the desired interface
                            Enumeration<InetAddress> as
                                = networkInterface.getInetAddresses();
                            while (as.hasMoreElements()) {
                                InetAddress a = as.nextElement();
                                if(a.equals(wifiAddress)) {
                                    found = true;
                                    break;
                                }
                            }

                            if (found) {
                                // interface found let's put addresses
                                // to the result object
                                as = networkInterface.getInetAddresses();
                                while (as.hasMoreElements()) {
                                    InetAddress a = as.nextElement();
                                    if (a.isLinkLocalAddress())
                                        continue;

                                    addresses.put(a.getHostAddress());
                                }
                            }

                        }
                    } catch (SocketException e) {
                        JitsiMeetLogger.e(e, TAG + " Unable to NetworkInterface.getNetworkInterfaces()");
                    }

                    result.put("addresses", addresses);
                    promise.resolve(result.toString());

                    JitsiMeetLogger.d(TAG + " WiFi stats: " + result.toString());
                } catch (Throwable e) {
                    JitsiMeetLogger.e(e, TAG + " Failed to obtain wifi stats");
                    promise.reject(
                        new Exception("Failed to obtain wifi stats"));
                }
            }
        };
        executor.execute(r);
    }
}
