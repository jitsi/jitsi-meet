package org.jitsi.meet.sdk.connection_service;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.RequiresApi;
import android.telecom.Connection;
import android.telecom.ConnectionRequest;
import android.telecom.PhoneAccount;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.util.Log;

import com.facebook.react.bridge.Promise;

/**
 * Jitsi Meet implementation of {@link ConnectionService}. At the time of this
 * writing it implements only the outgoing call scenario.
 *
 * @author Pawel Domas
 */
@RequiresApi(api = Build.VERSION_CODES.O)
public class ConnectionService extends android.telecom.ConnectionService {

    /**
     * Tag used for logging.
     */
    public static final String TAG = "JitsiConnectionService";

    /**
     * The extra added to the {@link ConnectionImpl} and
     * {@link ConnectionRequest} which stores the call's UUID.
     */
    static final String EXTRAS_CALL_UUID = "org.jitsi.meet.CALL_UUID";

    /**
     * The extra added to the {@link ConnectionImpl} and {@link ConnectionRequest} which stores
     * the {@link PhoneAccountHandle} created for the call.
     */
    static final String EXTRA_PHONE_ACCOUNT_HANDLE
        = "org.jitsi.meet.sdk.connection_service.PHONE_ACCOUNT_HANDLE";

    @Override
    public Connection onCreateOutgoingConnection(
            PhoneAccountHandle accountHandle, ConnectionRequest request) {
        ConnectionImpl connection = new ConnectionImpl(this);

        connection.setConnectionProperties(Connection.PROPERTY_SELF_MANAGED);
        connection.setAddress(
            request.getAddress(),
            TelecomManager.PRESENTATION_ALLOWED);
        connection.setExtras(request.getExtras());

        Bundle moreExtras = new Bundle();

        moreExtras.putParcelable(
            EXTRA_PHONE_ACCOUNT_HANDLE,
            request.getAccountHandle());
        connection.putExtras(moreExtras);

        ConnectionList.getInstance().add(connection);
        Promise startCallPromise
            = ConnectionList
                .getInstance()
                .unregisterStartCallPromise(connection.getCallUUID());

        if (startCallPromise != null) {
            startCallPromise.resolve(null);
        } else {
            Log.e(TAG, String.format(
                "onCreateOutgoingConnection: no start call Promise for %s",
                connection.getCallUUID()));
        }

        // TODO Implement video state. Currently there's not much use of it
        // without the incoming call scenario.
        //
        // connection.setVideoState(request.getVideoState());

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
            PhoneAccountHandle account, ConnectionRequest request) {
        Log.e(TAG, "onCreateOutgoingConnectionFailed");

        String callUUID = request.getExtras().getString(EXTRAS_CALL_UUID);

        if (callUUID != null) {
            Promise startCallPromise
                = ConnectionList
                    .getInstance()
                    .unregisterStartCallPromise(callUUID);

            if (startCallPromise != null) {
                startCallPromise.reject(
                        "CREATE_OUTGOING_CALL_FAILED",
                        "create outgoing call failed");
            } else {
                Log.e(TAG, String.format(
                        "startCallFailed - no start call Promise for UUID: %s",
                        callUUID));
            }
        } else {
            Log.e(TAG,
                "onCreateOutgoingConnectionFailed "
                    + "- no call UUID in the request");
        }
    }

    /**
     * Registers new {@link PhoneAccountHandle}.
     *
     * @param context the current Android context.
     * @param address the phone account's address. At the time of this writing
     *        it's the call handle passed from the Java Script side.
     * @param callUUID the call's UUID for which the account is to be created.
     * @return {@link PhoneAccountHandle} described by the given arguments.
     */
    static PhoneAccountHandle registerPhoneAccount(
            Context context, Uri address, String callUUID) {
        PhoneAccountHandle phoneAccountHandle
            = new PhoneAccountHandle(
                    new ComponentName(context, ConnectionService.class),
                    address.toString());

        PhoneAccount.Builder builder
            = PhoneAccount.builder(phoneAccountHandle, callUUID)
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
}
