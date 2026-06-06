package org.jitsi.meet.sdk;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.bridge.ReadableMap;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;

/**
 * Wraps the name and extra data for the events that occur on the JS side and are
 * to be broadcasted.
 */
public class BroadcastEvent {

    private static final String TAG = BroadcastEvent.class.getSimpleName();

    private final Type type;
    private final HashMap<String, Object> data;

    public BroadcastEvent(String name, ReadableMap data) {
        this.type = Type.buildTypeFromName(name);
        this.data = data.toHashMap();
    }

    public BroadcastEvent(Intent intent) {
        this.type = Type.buildTypeFromAction(intent.getAction());
        this.data = buildDataFromBundle(intent.getExtras());
    }

    public Type getType() {
        return this.type;
    }

    public HashMap<String, Object> getData() {
        return this.data;
    }

    public Intent buildIntent() {
        if (type != null && type.action != null) {
            Intent intent = new Intent(type.action);

            for (String key : this.data.keySet()) {
                try {
                    intent.putExtra(key, this.data.get(key).toString());
                } catch (Exception e) {
                    JitsiMeetLogger.w(TAG + " invalid extra data in event", e);
                }
            }

            return intent;
        }

        return null;
    }

    private static HashMap<String, Object> buildDataFromBundle(Bundle bundle) {
        if (bundle != null) {
            try {
                HashMap<String, Object> map = new HashMap<>();

                for (String key : bundle.keySet()) {
                    map.put(key, bundle.get(key));
                }

                return map;
            } catch (Exception e) {
                JitsiMeetLogger.w(TAG + " invalid extra data", e);
            }
        }

        return null;
    }

    public enum Type {
        CONFERENCE_BLURRED("org.jitsi.meet.CONFERENCE_BLURRED"),
        CONFERENCE_FOCUSED("org.jitsi.meet.CONFERENCE_FOCUSED"),
        CONFERENCE_JOINED("org.jitsi.meet.CONFERENCE_JOINED"),
        CONFERENCE_TERMINATED("org.jitsi.meet.CONFERENCE_TERMINATED"),
        CONFERENCE_WILL_JOIN("org.jitsi.meet.CONFERENCE_WILL_JOIN"),
        AUDIO_MUTED_CHANGED("org.jitsi.meet.AUDIO_MUTED_CHANGED"),
        PARTICIPANT_JOINED("org.jitsi.meet.PARTICIPANT_JOINED"),
        PARTICIPANT_LEFT("org.jitsi.meet.PARTICIPANT_LEFT"),
        ENDPOINT_TEXT_MESSAGE_RECEIVED("org.jitsi.meet.ENDPOINT_TEXT_MESSAGE_RECEIVED"),
        SCREEN_SHARE_TOGGLED("org.jitsi.meet.SCREEN_SHARE_TOGGLED"),
        PARTICIPANTS_INFO_RETRIEVED("org.jitsi.meet.PARTICIPANTS_INFO_RETRIEVED"),
        CHAT_MESSAGE_RECEIVED("org.jitsi.meet.CHAT_MESSAGE_RECEIVED"),
        CHAT_TOGGLED("org.jitsi.meet.CHAT_TOGGLED"),
        VIDEO_MUTED_CHANGED("org.jitsi.meet.VIDEO_MUTED_CHANGED"),
        READY_TO_CLOSE("org.jitsi.meet.READY_TO_CLOSE"),
        TRANSCRIPTION_CHUNK_RECEIVED("org.jitsi.meet.TRANSCRIPTION_CHUNK_RECEIVED"),
        CUSTOM_BUTTON_PRESSED("org.jitsi.meet.CUSTOM_BUTTON_PRESSED"),
        CONFERENCE_UNIQUE_ID_SET("org.jitsi.meet.CONFERENCE_UNIQUE_ID_SET"),
        RECORDING_STATUS_CHANGED("org.jitsi.meet.RECORDING_STATUS_CHANGED");

        private static final String CONFERENCE_BLURRED_NAME = "CONFERENCE_BLURRED";
        private static final String CONFERENCE_FOCUSED_NAME = "CONFERENCE_FOCUSED";
        private static final String CONFERENCE_WILL_JOIN_NAME = "CONFERENCE_WILL_JOIN";
        private static final String CONFERENCE_JOINED_NAME = "CONFERENCE_JOINED";
        private static final String CONFERENCE_TERMINATED_NAME = "CONFERENCE_TERMINATED";
        private static final String AUDIO_MUTED_CHANGED_NAME = "AUDIO_MUTED_CHANGED";
        private static final String PARTICIPANT_JOINED_NAME = "PARTICIPANT_JOINED";
        private static final String PARTICIPANT_LEFT_NAME = "PARTICIPANT_LEFT";
        private static final String ENDPOINT_TEXT_MESSAGE_RECEIVED_NAME = "ENDPOINT_TEXT_MESSAGE_RECEIVED";
        private static final String SCREEN_SHARE_TOGGLED_NAME = "SCREEN_SHARE_TOGGLED";
        private static final String PARTICIPANTS_INFO_RETRIEVED_NAME = "PARTICIPANTS_INFO_RETRIEVED";
        private static final String CHAT_MESSAGE_RECEIVED_NAME = "CHAT_MESSAGE_RECEIVED";
        private static final String CHAT_TOGGLED_NAME = "CHAT_TOGGLED";
        private static final String VIDEO_MUTED_CHANGED_NAME = "VIDEO_MUTED_CHANGED";
        private static final String READY_TO_CLOSE_NAME = "READY_TO_CLOSE";
        private static final String TRANSCRIPTION_CHUNK_RECEIVED_NAME = "TRANSCRIPTION_CHUNK_RECEIVED";
        private static final String CUSTOM_BUTTON_PRESSED_NAME = "CUSTOM_BUTTON_PRESSED";
        private static final String CONFERENCE_UNIQUE_ID_SET_NAME = "CONFERENCE_UNIQUE_ID_SET";
        private static final String RECORDING_STATUS_CHANGED_NAME = "RECORDING_STATUS_CHANGED";

        private final String action;

        Type(String action) {
            this.action = action;
        }

        public String getAction() {
            return action;
        }

        private static Type buildTypeFromAction(String action) {
            for (Type type : Type.values()) {
                if (type.action.equalsIgnoreCase(action)) {
                    return type;
                }
            }
            return null;
        }

        private static Type buildTypeFromName(String name) {
            switch (name) {
                case CONFERENCE_BLURRED_NAME:
                    return CONFERENCE_BLURRED;
                case CONFERENCE_FOCUSED_NAME:
                    return CONFERENCE_FOCUSED;
                case CONFERENCE_WILL_JOIN_NAME:
                    return CONFERENCE_WILL_JOIN;
                case CONFERENCE_JOINED_NAME:
                    return CONFERENCE_JOINED;
                case CONFERENCE_TERMINATED_NAME:
                    return CONFERENCE_TERMINATED;
                case AUDIO_MUTED_CHANGED_NAME:
                    return AUDIO_MUTED_CHANGED;
                case PARTICIPANT_JOINED_NAME:
                    return PARTICIPANT_JOINED;
                case PARTICIPANT_LEFT_NAME:
                    return PARTICIPANT_LEFT;
                case ENDPOINT_TEXT_MESSAGE_RECEIVED_NAME:
                    return ENDPOINT_TEXT_MESSAGE_RECEIVED;
                case SCREEN_SHARE_TOGGLED_NAME:
                    return SCREEN_SHARE_TOGGLED;
                case PARTICIPANTS_INFO_RETRIEVED_NAME:
                    return PARTICIPANTS_INFO_RETRIEVED;
                case CHAT_MESSAGE_RECEIVED_NAME:
                    return CHAT_MESSAGE_RECEIVED;
                case CHAT_TOGGLED_NAME:
                    return CHAT_TOGGLED;
                case VIDEO_MUTED_CHANGED_NAME:
                    return VIDEO_MUTED_CHANGED;
                case READY_TO_CLOSE_NAME:
                    return READY_TO_CLOSE;
                case TRANSCRIPTION_CHUNK_RECEIVED_NAME:
                    return TRANSCRIPTION_CHUNK_RECEIVED;
                case CUSTOM_BUTTON_PRESSED_NAME:
                    return CUSTOM_BUTTON_PRESSED;
                case CONFERENCE_UNIQUE_ID_SET_NAME:
                    return CONFERENCE_UNIQUE_ID_SET;
                case RECORDING_STATUS_CHANGED_NAME:
                    return RECORDING_STATUS_CHANGED;
            }

            return null;
        }
    }
}
