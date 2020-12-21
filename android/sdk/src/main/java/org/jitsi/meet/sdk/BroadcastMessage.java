package org.jitsi.meet.sdk;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableNativeMap;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;

public class BroadcastMessage {

    private static final String TAG = BroadcastMessage.class.getSimpleName();

    private final Type type;
    private final HashMap<String, String> data;
    private final int emitterId;

    public BroadcastMessage(String name, ReadableMap data, int emitterId) {
        this.type = Type.buildTypeFromName(name);
        this.data = buildDataFromReadableMap(data);
        this.emitterId = emitterId;
    }

    public BroadcastMessage(Intent intent) {
        this.type = Type.buildTypeFromAction(intent.getAction());
        this.data = buildDataFromBundle(intent.getExtras());
        this.emitterId = 0;
    }

    public Type getType() {
        return this.type;
    }

    public String getAction() {
        return this.type.action;
    }

    public int getEmitterId() {
        return this.emitterId;
    }

    public HashMap<String, String> getData() {
        return this.data;
    }

    public Intent buildIntent() {
        if (type != null && type.action != null) {
            Intent intent = new Intent(type.action);


            intent.putExtra(Type.extraData, data);

            return intent;
        }

        return null;
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

    private static HashMap<String, String> buildDataFromReadableMap(ReadableMap readableMap) {
        HashMap<String, String> hashMap = new HashMap<>();

        for (ReadableMapKeySetIterator i = readableMap.keySetIterator();
             i.hasNextKey(); ) {
            String key = i.nextKey();

            hashMap.put(key, readableMap.getString(key));
        }

        return hashMap;
    }

    public enum Type {
        CONFERENCE_JOINED("org.jitsi.meet.CONFERENCE_JOINED"),
        CONFERENCE_TERMINATED("org.jitsi.meet.CONFERENCE_TERMINATED"),
        CONFERENCE_WILL_JOIN("org.jitsi.meet.CONFERENCE_WILL_JOIN"),
        SEND_MESSAGE("org.jitsi.meet.SEND_MESSAGE"),
        AUDIO_MUTED_CHANGED("org.jitsi.meet.AUDIO_MUTED_CHANGED"),
        SET_AUDIO_MUTED("org.jitsi.meet.SET_AUDIO_MUTED");

        public static final String extraData = "extraData";

        private static final String CONFERENCE_WILL_JOIN_NAME = "CONFERENCE_WILL_JOIN";
        private static final String CONFERENCE_JOINED_NAME = "CONFERENCE_JOINED";
        private static final String CONFERENCE_TERMINATED_NAME = "CONFERENCE_TERMINATED";
        private static final String AUDIO_MUTED_CHANGED_NAME = "SET_AUDIO_MUTED";

        private final String action;

        Type(String action) {
            this.action = action;
        }

        public String getAction() {
            return action;
        }

        public static Type buildTypeFromName(String name) {
            switch (name) {
                case CONFERENCE_WILL_JOIN_NAME:
                    return CONFERENCE_WILL_JOIN;
                case CONFERENCE_JOINED_NAME:
                    return CONFERENCE_JOINED;
                case CONFERENCE_TERMINATED_NAME:
                    return CONFERENCE_TERMINATED;
                case AUDIO_MUTED_CHANGED_NAME:
                    return AUDIO_MUTED_CHANGED;
            }

            return null;
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
