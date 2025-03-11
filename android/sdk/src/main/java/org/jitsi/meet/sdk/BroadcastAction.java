package org.jitsi.meet.sdk;

import android.content.Intent;
import android.os.Bundle;

/**
 * Wraps the name and extra data for events that were broadcasted locally.
 */
public class BroadcastAction {
    private static final String TAG = BroadcastAction.class.getSimpleName();

    private final Type type;
    private final Bundle data;

    public BroadcastAction(Intent intent) {
        this.type = Type.buildTypeFromAction(intent.getAction());
        this.data = intent.getExtras();
    }

    public Type getType() {
        return this.type;
    }

    public Bundle getData() {
        return this.data;
    }

    enum Type {
        SET_AUDIO_MUTED("org.jitsi.meet.SET_AUDIO_MUTED"),
        HANG_UP("org.jitsi.meet.HANG_UP"),
        SEND_ENDPOINT_TEXT_MESSAGE("org.jitsi.meet.SEND_ENDPOINT_TEXT_MESSAGE"),
        TOGGLE_SCREEN_SHARE("org.jitsi.meet.TOGGLE_SCREEN_SHARE"),
        RETRIEVE_PARTICIPANTS_INFO("org.jitsi.meet.RETRIEVE_PARTICIPANTS_INFO"),
        OPEN_CHAT("org.jitsi.meet.OPEN_CHAT"),
        CLOSE_CHAT("org.jitsi.meet.CLOSE_CHAT"),
        SEND_CHAT_MESSAGE("org.jitsi.meet.SEND_CHAT_MESSAGE"),
        SET_VIDEO_MUTED("org.jitsi.meet.SET_VIDEO_MUTED"),
        SET_CLOSED_CAPTIONS_ENABLED("org.jitsi.meet.SET_CLOSED_CAPTIONS_ENABLED"),
        TOGGLE_CAMERA("org.jitsi.meet.TOGGLE_CAMERA"),
        SHOW_NOTIFICATION("org.jitsi.meet.SHOW_NOTIFICATION"),
        HIDE_NOTIFICATION("org.jitsi.meet.HIDE_NOTIFICATION"),
        START_RECORDING("org.jitsi.meet.START_RECORDING"),
        STOP_RECORDING("org.jitsi.meet.STOP_RECORDING"),
        OVERWRITE_CONFIG("org.jitsi.meet.OVERWRITE_CONFIG"),
        SEND_CAMERA_FACING_MODE_MESSAGE("org.jitsi.meet.SEND_CAMERA_FACING_MODE_MESSAGE");

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
    }
}
