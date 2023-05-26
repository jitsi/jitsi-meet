package org.jitsi.meet.sdk;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telecom.VideoProfile;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * The react-native side of Jitsi Meet's {@link ConnectionService}. Exposes
 * the Java Script API.
 *
 * @author Pawel Domas
 */
@RequiresApi(api = Build.VERSION_CODES.O)
@ReactModule(name = RNConnectionService.NAME)
class RNConnectionService extends ReactContextBaseJavaModule {

    public static final String NAME = "ConnectionService";

    private static final String TAG = ConnectionService.TAG;

    private static RNConnectionService sRNConnectionServiceInstance;
    /**
     * Handler for dealing with call state changes. We are acting as a proxy between ConnectionService
     * and other modules such as {@link AudioModeModule}.
     */
    private CallAudioStateListener callAudioStateListener;

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
        sRNConnectionServiceInstance = this;
    }

    static RNConnectionService getInstance() {
        return sRNConnectionServiceInstance;
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
        JitsiMeetLogger.d("%s startCall UUID=%s, h=%s, v=%s",
                            TAG,
                            callUUID,
                            handle,
                            hasVideo);

        ReactApplicationContext ctx = getReactApplicationContext();

        Uri address = Uri.fromParts(PhoneAccount.SCHEME_SIP, handle, null);
        PhoneAccountHandle accountHandle;

        try {
            accountHandle
                = ConnectionService.registerPhoneAccount(getReactApplicationContext(), address, callUUID);
        } catch (Throwable tr) {
            JitsiMeetLogger.e(tr, TAG + " error in startCall");

            promise.reject(tr);
            return;
        }

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

        TelecomManager tm = null;

        try {
            tm = (TelecomManager) ctx.getSystemService(Context.TELECOM_SERVICE);
            tm.placeCall(address, extras);
        } catch (Throwable tr) {
            JitsiMeetLogger.e(tr, TAG + " error in startCall");
            if (tm != null) {
                try {
                    tm.unregisterPhoneAccount(accountHandle);
                } catch (Throwable tr1) {
                    // UnsupportedOperationException: System does not support feature android.software.connectionservice
                    // was observed here. Ignore.
                }
            }
            ConnectionService.unregisterStartCallPromise(callUUID);
            promise.reject(tr);
        }
    }

    /**
     * Called by the JS side of things to mark the call as failed.
     *
     * @param callUUID - the call's UUID.
     */
    @ReactMethod
    public void reportCallFailed(String callUUID) {
        JitsiMeetLogger.d(TAG + " reportCallFailed " + callUUID);
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
        JitsiMeetLogger.d(TAG + " endCall " + callUUID);
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
    public void reportConnectedOutgoingCall(String callUUID, Promise promise) {
        JitsiMeetLogger.d(TAG + " reportConnectedOutgoingCall " + callUUID);
        if (ConnectionService.setConnectionActive(callUUID)) {
            promise.resolve(null);
        } else {
            promise.reject("CONNECTION_NOT_FOUND_ERROR", "Connection wasn't found.");
        }
    }

    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Called by the JS side to update the call's state.
     *
     * @param callUUID - the call's UUID.
     * @param callState - the map which carries info about the current call's
     * state. See static fields in {@link ConnectionService.ConnectionImpl}
     * prefixed with "KEY_" for the values supported by the Android
     * implementation.
     */
    @ReactMethod
    public void updateCall(String callUUID, ReadableMap callState) {
        ConnectionService.updateCall(callUUID, callState);
    }

    public CallAudioStateListener getCallAudioStateListener() {
        return callAudioStateListener;
    }

    public void setCallAudioStateListener(CallAudioStateListener callAudioStateListener) {
        this.callAudioStateListener = callAudioStateListener;
    }

    /**
     * Handler for call state changes. {@code ConnectionServiceImpl} will call this handler when the
     * call audio state changes.
     *
     * @param callAudioState The current call's audio state.
     */
    void onCallAudioStateChange(android.telecom.CallAudioState callAudioState) {
        if (callAudioStateListener != null) {
            callAudioStateListener.onCallAudioStateChange(callAudioState);
        }
    }

    interface CallAudioStateListener {
        void onCallAudioStateChange(android.telecom.CallAudioState callAudioState);
    }

    /**
     * Helper function to send an event to JavaScript.
     *
     * @param eventName {@code String} containing the event name.
     * @param data {@code Object} optional ancillary data for the event.
     */
    void emitEvent(
        String eventName,
        @Nullable Object data) {
        ReactContext reactContext = getReactApplicationContext();

        if (reactContext != null) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
        }
    }
}
