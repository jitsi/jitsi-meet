package org.jitsi.meet.sdk.connection_service;

import android.os.Build;
import android.support.annotation.RequiresApi;
import android.telecom.DisconnectCause;
import android.util.Log;

import com.facebook.react.bridge.Promise;

import java.util.HashMap;
import java.util.Map;

/**
 * This holds all connections created by the {@link ConnectionService}. It
 * serves as a bridge for storing the state used by both
 * {@link RNConnectionService} and {@link ConnectionService}.
 * Pawel: ideally this state would live inside the {@link ConnectionService},
 * but I haven't found a clean way to access the {@link ConnectionService} from
 * {@link RNConnectionService}.
 *
 * @author Pawel Domas
 */
@RequiresApi(api = Build.VERSION_CODES.O)
public class ConnectionList {

    private static final String TAG = ConnectionService.TAG;

    private static ConnectionList instance;

    static public ConnectionList getInstance() {
        if (instance == null) {
            instance = new ConnectionList();
        }
        return instance;
    }

    /**
     * Connections mapped by call UUID.
     */
    private final Map<String, ConnectionImpl> connections = new HashMap<>();

    /**
     * The start call Promises mapped by call UUID.
     */
    private HashMap<String, Promise> startCallPromises = new HashMap<>();

    private ConnectionList() { }

    /**
     * Adds {@link ConnectionImpl} to the list.
     *
     * @param connection - {@link ConnectionImpl}
     */
    void add(ConnectionImpl connection) {
        connections.put(connection.getCallUUID(), connection);
    }

    /**
     * Registers a start call promise.
     *
     * @param uuid - the call UUID to which the start call promise belongs to.
     * @param promise - the Promise instance to be stored for later use.
     */
    void registerStartCallPromise(String uuid, Promise promise) {
        startCallPromises.put(uuid, promise);
    }

    /**
     * Removes {@link ConnectionImpl} from the list.
     *
     * @param connection - {@link ConnectionImpl}
     */
    void remove(ConnectionImpl connection) {
        connections.remove(connection.getCallUUID());
    }

    /**
     * Used to adjusts the connection's state to
     * {@link android.telecom.Connection#STATE_ACTIVE}.
     *
     * @param callUUID the call UUID which identifies the connection.
     */
    void setConnectionActive(String callUUID) {
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
    void setConnectionDisconnected(String callUUID, DisconnectCause cause) {
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
    Promise unregisterStartCallPromise(String uuid) {
        return startCallPromises.remove(uuid);
    }
}
