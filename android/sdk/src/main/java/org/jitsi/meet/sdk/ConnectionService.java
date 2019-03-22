package org.jitsi.meet.sdk;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.RequiresApi;
import android.telecom.CallAudioState;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.DisconnectCause;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telecom.VideoProfile;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Jitsi Meet implementation of {@link ConnectionService}. At the time of this
 * writing it implements only the outgoing call scenario.
 *
 * NOTE the class needs to be public, but is not part of the SDK API and should
 * never be used directly.
 *
 * @author Pawel Domas
 */
@RequiresApi(api = Build.VERSION_CODES.O)
public class ConnectionService extends android.telecom.ConnectionService {

    /**
     * Tag used for logging.
     */
    static final String TAG = "JitsiConnectionService";

    /**
     * The extra added to the {@link ConnectionImpl} and
     * {@link ConnectionRequest} which stores the {@link PhoneAccountHandle}
     * created for the call.
     */
    static final String EXTRA_PHONE_ACCOUNT_HANDLE
        = "org.jitsi.meet.sdk.connection_service.PHONE_ACCOUNT_HANDLE";

    /**
     * Connections mapped by call UUID.
     */
    static private final Map<String, ConnectionImpl> connections
            = new HashMap<>();

    /**
     * The start call Promises mapped by call UUID.
     */
    static private final HashMap<String, Promise> startCallPromises
            = new HashMap<>();

    /**
     * Adds {@link ConnectionImpl} to the list.
     *
     * @param connection - {@link ConnectionImpl}
     */
    static void addConnection(ConnectionImpl connection) {
        connections.put(connection.getCallUUID(), connection);
    }

    /**
     * Returns all {@link ConnectionImpl} instances held in this list.
     *
     * @return a list of {@link ConnectionImpl}.
     */
    static List<ConnectionImpl> getConnections() {
        return new ArrayList<>(connections.values());
    }

    /**
     * Registers a start call promise.
     *
     * @param uuid - the call UUID to which the start call promise belongs to.
     * @param promise - the Promise instance to be stored for later use.
     */
    static void registerStartCallPromise(String uuid, Promise promise) {
        startCallPromises.put(uuid, promise);
    }

    /**
     * Removes {@link ConnectionImpl} from the list.
     *
     * @param connection - {@link ConnectionImpl}
     */
    static void removeConnection(ConnectionImpl connection) {
        connections.remove(connection.getCallUUID());
    }

    /**
     * Used to adjusts the connection's state to
     * {@link android.telecom.Connection#STATE_ACTIVE}.
     *
     * @param callUUID the call UUID which identifies the connection.
     */
    static void setConnectionActive(String callUUID) {
        ConnectionImpl connection = connections.get(callUUID);

        if (connection != null) {
            connection.setActive();
        } else {
            Log.e(TAG, String.format(
                    "setConnectionActive - no connection for UUID: %s",
                    callUUID));
        }
    }

    /**
     * Used to adjusts the connection's state to
     * {@link android.telecom.Connection#STATE_DISCONNECTED}.
     *
     * @param callUUID the call UUID which identifies the connection.
     * @param cause disconnection reason.
     */
    static void setConnectionDisconnected(String callUUID, DisconnectCause cause) {
        ConnectionImpl connection = connections.get(callUUID);

        if (connection != null) {
            // Note that the connection is not removed from the list here, but
            // in ConnectionImpl's state changed callback. It's a safer
            // approach, because in case the app would crash on the JavaScript
            // side the calls would be cleaned up by the system they would still
            // be removed from the ConnectionList.
            connection.setDisconnected(cause);
            connection.destroy();
        } else {
            Log.e(TAG, "endCall no connection for UUID: " + callUUID);
        }
    }

    /**
     * Unregisters a start call promise. Must be called after the Promise is
     * rejected or resolved.
     *
     * @param uuid the call UUID which identifies the call to which the promise
     *        belongs to.
     * @return the unregistered Promise instance or <tt>null</tt> if there
     *         wasn't any for the given call UUID.
     */
    static Promise unregisterStartCallPromise(String uuid) {
        return startCallPromises.remove(uuid);
    }

    /**
     * Used to adjusts the call's state.
     *
     * @param callUUID the call UUID which identifies the connection.
     * @param callState a map which carries the properties to be modified. See
     *        "KEY_*" constants in {@link ConnectionImpl} for the list of keys.
     */
    static void updateCall(String callUUID, ReadableMap callState) {
        ConnectionImpl connection = connections.get(callUUID);

        if (connection != null) {
            if (callState.hasKey(ConnectionImpl.KEY_HAS_VIDEO)) {
                boolean hasVideo
                        = callState.getBoolean(ConnectionImpl.KEY_HAS_VIDEO);

                Log.d(TAG, String.format(
                        "updateCall: %s hasVideo: %s", callUUID, hasVideo));
                connection.setVideoState(
                        hasVideo
                                ? VideoProfile.STATE_BIDIRECTIONAL
                                : VideoProfile.STATE_AUDIO_ONLY);
            }
        } else {
            Log.e(TAG, "updateCall no connection for UUID: " + callUUID);
        }
    }

    @Override
    public Connection onCreateOutgoingConnection(
            PhoneAccountHandle accountHandle, ConnectionRequest request) {
        ConnectionImpl connection = new ConnectionImpl();

        connection.setConnectionProperties(Connection.PROPERTY_SELF_MANAGED);
        connection.setAddress(
            request.getAddress(),
            TelecomManager.PRESENTATION_ALLOWED);
        connection.setExtras(request.getExtras());

        connection.setAudioModeIsVoip(true);

        // NOTE there's a time gap between the placeCall and this callback when
        // things could get out of sync, but they are put back in sync once
        // the startCall Promise is resolved below. That's because on
        // the JavaScript side there's a logic to sync up in .then() callback.
        connection.setVideoState(request.getVideoState());

        Bundle moreExtras = new Bundle();

        moreExtras.putParcelable(
            EXTRA_PHONE_ACCOUNT_HANDLE,
            Objects.requireNonNull(request.getAccountHandle(), "accountHandle"));
        connection.putExtras(moreExtras);

        addConnection(connection);

        Promise startCallPromise
            = unregisterStartCallPromise(connection.getCallUUID());

        if (startCallPromise != null) {
            Log.d(TAG,
                  "onCreateOutgoingConnection " + connection.getCallUUID());
            startCallPromise.resolve(null);
        } else {
            Log.e(TAG, String.format(
                "onCreateOutgoingConnection: no start call Promise for %s",
                connection.getCallUUID()));
        }

        return connection;
    }

    @Override
    public Connection onCreateIncomingConnection(
            PhoneAccountHandle accountHandle, ConnectionRequest request) {
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void onCreateIncomingConnectionFailed(
            PhoneAccountHandle accountHandle, ConnectionRequest request) {
        throw new RuntimeException("Not implemented");
    }

    @Override
    public void onCreateOutgoingConnectionFailed(
            PhoneAccountHandle accountHandle, ConnectionRequest request) {
        PhoneAccountHandle theAccountHandle = request.getAccountHandle();
        String callUUID = theAccountHandle.getId();

        Log.e(TAG, "onCreateOutgoingConnectionFailed " + callUUID);

        if (callUUID != null) {
            Promise startCallPromise = unregisterStartCallPromise(callUUID);

            if (startCallPromise != null) {
                startCallPromise.reject(
                        "CREATE_OUTGOING_CALL_FAILED",
                        "The request has been denied by the system");
            } else {
                Log.e(TAG, String.format(
                        "startCallFailed - no start call Promise for UUID: %s",
                        callUUID));
            }
        } else {
            Log.e(TAG, "onCreateOutgoingConnectionFailed - no call UUID");
        }

        unregisterPhoneAccount(theAccountHandle);
    }

    private void unregisterPhoneAccount(PhoneAccountHandle phoneAccountHandle) {
        TelecomManager telecom = getSystemService(TelecomManager.class);
        if (telecom != null) {
            if (phoneAccountHandle != null) {
                telecom.unregisterPhoneAccount(phoneAccountHandle);
            } else {
                Log.e(TAG, "unregisterPhoneAccount - account handle is null");
            }
        } else {
            Log.e(TAG, "unregisterPhoneAccount - telecom is null");
        }
    }

    /**
     * Registers new {@link PhoneAccountHandle}.
     *
     * @param context the current Android context.
     * @param address the phone account's address. At the time of this writing
     *        it's the call handle passed from the Java Script side.
     * @param callUUID the call's UUID for which the account is to be created.
     *        It will be used as the account's id.
     * @return {@link PhoneAccountHandle} described by the given arguments.
     */
    static PhoneAccountHandle registerPhoneAccount(
            Context context, Uri address, String callUUID) {
        PhoneAccountHandle phoneAccountHandle
            = new PhoneAccountHandle(
                    new ComponentName(context, ConnectionService.class),
                    callUUID);

        PhoneAccount.Builder builder
            = PhoneAccount.builder(phoneAccountHandle, address.toString())
                .setAddress(address)
                .setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED |
                        PhoneAccount.CAPABILITY_VIDEO_CALLING |
                        PhoneAccount.CAPABILITY_SUPPORTS_VIDEO_CALLING)
                .addSupportedUriScheme(PhoneAccount.SCHEME_SIP);

        PhoneAccount account = builder.build();

        TelecomManager telecomManager
            = context.getSystemService(TelecomManager.class);
        telecomManager.registerPhoneAccount(account);

        return phoneAccountHandle;
    }

    /**
     * Connection implementation for Jitsi Meet's {@link ConnectionService}.
     *
     * @author Pawel Domas
     */
    class ConnectionImpl extends Connection {

        /**
         * The constant which defines the key for the "has video" property.
         * The key is used in the map which carries the call's state passed as
         * the argument of the {@link RNConnectionService#updateCall} method.
         */
        static final String KEY_HAS_VIDEO = "hasVideo";

        /**
         * Called when system wants to disconnect the call.
         *
         * {@inheritDoc}
         */
        @Override
        public void onDisconnect() {
            Log.d(TAG, "onDisconnect " + getCallUUID());
            WritableNativeMap data = new WritableNativeMap();
            data.putString("callUUID", getCallUUID());
            ReactInstanceManagerHolder.emitEvent(
                    "org.jitsi.meet:features/connection_service#disconnect",
                    data);
            // The JavaScript side will not go back to the native with
            // 'endCall', so the Connection must be removed immediately.
            setConnectionDisconnected(
                    getCallUUID(),
                    new DisconnectCause(DisconnectCause.LOCAL));
        }

        /**
         * Called when system wants to abort the call.
         *
         * {@inheritDoc}
         */
        @Override
        public void onAbort() {
            Log.d(TAG, "onAbort " + getCallUUID());
            WritableNativeMap data = new WritableNativeMap();
            data.putString("callUUID", getCallUUID());
            ReactInstanceManagerHolder.emitEvent(
                    "org.jitsi.meet:features/connection_service#abort",
                    data);
            // The JavaScript side will not go back to the native with
            // 'endCall', so the Connection must be removed immediately.
            setConnectionDisconnected(
                    getCallUUID(),
                    new DisconnectCause(DisconnectCause.CANCELED));
        }

        @Override
        public void onHold() {
            // What ?! Android will still call this method even if we do not add
            // the HOLD capability, so do the same thing as on abort.
            // TODO implement HOLD
            Log.d(TAG, String.format(
                  "onHold %s - HOLD is not supported, aborting the call...",
                  getCallUUID()));
            this.onAbort();
        }

        /**
         * Called when there's change to the call audio state. Either by
         * the system after the connection is initialized or in response to
         * {@link #setAudioRoute(int)}.
         *
         * @param state the new {@link CallAudioState}
         */
        @Override
        public void onCallAudioStateChanged(CallAudioState state) {
            Log.d(TAG, "onCallAudioStateChanged: " + state);
            AudioModeModule audioModeModule
                    = ReactInstanceManagerHolder
                    .getNativeModule(AudioModeModule.class);
            if (audioModeModule != null) {
                audioModeModule.onCallAudioStateChange(state);
            }
        }

        /**
         * Unregisters the account when the call is disconnected.
         *
         * @param state - the new connection's state.
         */
        @Override
        public void onStateChanged(int state) {
            Log.d(TAG,
                  String.format("onStateChanged: %s %s",
                                Connection.stateToString(state),
                                getCallUUID()));

            if (state == STATE_DISCONNECTED) {
                removeConnection(this);
                unregisterPhoneAccount(getPhoneAccountHandle());
            }
        }

        /**
         * Retrieves the UUID of the call associated with this connection.
         *
         * @return call UUID
         */
        String getCallUUID() {
            return getPhoneAccountHandle().getId();
        }

        private PhoneAccountHandle getPhoneAccountHandle() {
            return getExtras().getParcelable(
                    ConnectionService.EXTRA_PHONE_ACCOUNT_HANDLE);
        }

        @Override
        public String toString() {
            return String.format(
                    "ConnectionImpl[address=%s, uuid=%s]@%d",
                    getAddress(), getCallUUID(), hashCode());
        }
    }
}
