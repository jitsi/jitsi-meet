package org.jitsi.meet.sdk;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.bridge.WritableNativeMap;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;

public class BroadcastAction {
    private static final String TAG = BroadcastAction.class.getSimpleName();

    private final Type type;
    private final HashMap<String, String> data;

    public BroadcastAction(Intent intent) {
        this.type = Type.buildTypeFromAction(intent.getAction());
        this.data = buildDataFromBundle(intent.getExtras());
    }

    public Type getType() {
        return this.type;
    }

    public HashMap<String, String> getData() {
        return this.data;
    }

    public WritableNativeMap getDataAsWritableNativeMap() {
        WritableNativeMap nativeMap = new WritableNativeMap();

        for (String key : this.data.keySet()) {
            nativeMap.putString(key, this.data.get(key));
        }

        return nativeMap;
    }

    private static HashMap<String, String> buildDataFromBundle(Bundle bundle) {
        HashMap<String, String> map = new HashMap<>();

        if (bundle != null) {
            for (String key : bundle.keySet()) {
                try {
                    String value = bundle.get(key).toString();

                    if (value != null) {
                        map.put(key, value);
                    }
                } catch (Exception e) {
                    JitsiMeetLogger.i(TAG + " invalid extra data", e);
                }
            }
        }

        return map;
    }

    enum Type {
        SET_AUDIO_MUTED("org.jitsi.meet.SET_AUDIO_MUTED"),
        HANG_UP("org.jitsi.meet.HANG_UP");

        private final String action;

        Type(String action) {
            this.action = action;
        }

        public String getAction() {
            return action;
        }

        public static Type buildTypeFromAction(String action) {
            for (Type type : Type.values()) {
                if (type.action.equalsIgnoreCase(action)) {
                    return type;
                }
            }
            return null;
        }
    }
}
