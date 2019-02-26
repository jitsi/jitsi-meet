package org.jitsi.meet.sdk;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.RequiresApi;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telecom.VideoProfile;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

/**
 * The react-native side of Jitsi Meet's {@link ConnectionService}. Exposes
 * the Java Script API.
 *
 * @author Pawel Domas
 */
@RequiresApi(api = Build.VERSION_CODES.O)
class RNConnectionService
    extends ReactContextBaseJavaModule {

    private final static String TAG = ConnectionService.TAG;

    /**
     * Sets the audio route on all existing {@link android.telecom.Connection}s
     *
     * @param audioRoute the new audio route to be set. See
     * {@link android.telecom.CallAudioState} constants prefixed with "ROUTE_".
     */
    @RequiresApi(api = Build.VERSION_CODES.O)
    static void setAudioRoute(int audioRoute) {
        for (ConnectionService.ConnectionImpl c
                : ConnectionService.getConnections()) {
            c.setAudioRoute(audioRoute);
        }
    }

    RNConnectionService(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Starts a new outgoing call.
     *
     * @param callUUID - unique call identifier assigned by Jitsi Meet to
     *        a conference call.
     * @param handle - a call handle which by default is Jitsi Meet room's URL.
     * @param hasVideo - whether or not user starts with the video turned on.
     * @param promise - the Promise instance passed by the React-native bridge,
     *        so that this method returns a Promise on the JS side.
     *
     * NOTE regarding the "missingPermission" suppress - SecurityException will
     * be handled as part of the Exception try catch block and the Promise will
     * be rejected.
     */
    @SuppressLint("MissingPermission")
    @ReactMethod
    public void startCall(
            String callUUID,
            String handle,
            boolean hasVideo,
            Promise promise) {
        Log.d(TAG,
              String.format("startCall UUID=%s, h=%s, v=%s",
                            callUUID,
                            handle,
                            hasVideo));

        ReactApplicationContext ctx = getReactApplicationContext();

        Uri address = Uri.fromParts(PhoneAccount.SCHEME_SIP, handle, null);
        PhoneAccountHandle accountHandle
            = ConnectionService.registerPhoneAccount(
                    getReactApplicationContext(), address, callUUID);

        Bundle extras = new Bundle();
        extras.putParcelable(
                TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE,
                accountHandle);
        extras.putInt(
            TelecomManager.EXTRA_START_CALL_WITH_VIDEO_STATE,
            hasVideo
                ? VideoProfile.STATE_BIDIRECTIONAL
                : VideoProfile.STATE_AUDIO_ONLY);

        ConnectionService.registerStartCallPromise(callUUID, promise);

        try {
            TelecomManager tm
                = (TelecomManager) ctx.getSystemService(
                        Context.TELECOM_SERVICE);

            tm.placeCall(address, extras);
        } catch (Exception e) {
            ConnectionService.unregisterStartCallPromise(callUUID);
            promise.reject(e);
        }
    }

    /**
     * Called by the JS side of things to mark the call as failed.
     *
     * @param callUUID - the call's UUID.
     */
    @ReactMethod
    public void reportCallFailed(String callUUID) {
        Log.d(TAG, "reportCallFailed " + callUUID);
        ConnectionService.setConnectionDisconnected(
                callUUID,
                new DisconnectCause(DisconnectCause.ERROR));
    }

    /**
     * Called by the JS side of things to mark the call as disconnected.
     *
     * @param callUUID - the call's UUID.
     */
    @ReactMethod
    public void endCall(String callUUID) {
        Log.d(TAG, "endCall " + callUUID);
        ConnectionService.setConnectionDisconnected(
                callUUID,
                new DisconnectCause(DisconnectCause.LOCAL));
    }

    /**
     * Called by the JS side of things to mark the call as active.
     *
     * @param callUUID - the call's UUID.
     */
    @ReactMethod
    public void reportConnectedOutgoingCall(String callUUID) {
        Log.d(TAG, "reportConnectedOutgoingCall " + callUUID);
        ConnectionService.setConnectionActive(callUUID);
    }

    @Override
    public String getName() {
        return "ConnectionService";
    }

    /**
     * Called by the JS side to update the call's state.
     *
     * @param callUUID - the call's UUID.
     * @param callState - the map which carries infor about the current call's
     * state. See static fields in {@link ConnectionService.ConnectionImpl}
     * prefixed with "KEY_" for the values supported by the Android
     * implementation.
     */
    @ReactMethod
    public void updateCall(String callUUID, ReadableMap callState) {
        ConnectionService.updateCall(callUUID, callState);
    }
}
