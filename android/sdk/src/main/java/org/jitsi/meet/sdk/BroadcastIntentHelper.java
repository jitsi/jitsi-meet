package org.jitsi.meet.sdk;

import android.content.Intent;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.Arrays;
import java.util.List;

public class BroadcastIntentHelper {
    public static Intent buildSetAudioMutedIntent(boolean muted) {
        Intent intent = new Intent(BroadcastAction.Type.SET_AUDIO_MUTED.getAction());
        intent.putExtra("muted", muted);
        return intent;
    }

    public static Intent buildHangUpIntent() {
        return new Intent(BroadcastAction.Type.HANG_UP.getAction());
    }

    public static Intent buildSendEndpointTextMessageIntent(String to, String message) {
        Intent intent = new Intent(BroadcastAction.Type.SEND_ENDPOINT_TEXT_MESSAGE.getAction());
        intent.putExtra("to", to);
        intent.putExtra("message", message);
        return intent;
    }

    public static Intent buildToggleScreenShareIntent(boolean enabled) {
        Intent intent = new Intent(BroadcastAction.Type.TOGGLE_SCREEN_SHARE.getAction());
        intent.putExtra("enabled", enabled);
        return intent;
    }

    public static Intent buildOpenChatIntent(String participantId) {
        Intent intent = new Intent(BroadcastAction.Type.OPEN_CHAT.getAction());
        intent.putExtra("to", participantId);
        return intent;
    }

    public static Intent buildCloseChatIntent() {
        return new Intent(BroadcastAction.Type.CLOSE_CHAT.getAction());
    }

    public static Intent buildSendChatMessageIntent(String participantId, String message) {
        Intent intent = new Intent(BroadcastAction.Type.SEND_CHAT_MESSAGE.getAction());
        intent.putExtra("to", participantId);
        intent.putExtra("message", message);
        return intent;
    }

    public static Intent buildSetVideoMutedIntent(boolean muted) {
        Intent intent = new Intent(BroadcastAction.Type.SET_VIDEO_MUTED.getAction());
        intent.putExtra("muted", muted);
        return intent;
    }

    public static Intent buildSetClosedCaptionsEnabledIntent(boolean enabled) {
        Intent intent = new Intent(BroadcastAction.Type.SET_CLOSED_CAPTIONS_ENABLED.getAction());
        intent.putExtra("enabled", enabled);
        return intent;
    }

    public static Intent buildRetrieveParticipantsInfo(String requestId) {
        Intent intent = new Intent(BroadcastAction.Type.RETRIEVE_PARTICIPANTS_INFO.getAction());
        intent.putExtra("requestId", requestId);
        return intent;
    }

    public static Intent buildToggleCameraIntent() {
        return new Intent(BroadcastAction.Type.TOGGLE_CAMERA.getAction());
    }

    public static Intent buildShowNotificationIntent(
        String appearance, String description, String timeout, String title, String uid) {
        Intent intent = new Intent(BroadcastAction.Type.SHOW_NOTIFICATION.getAction());
        intent.putExtra("appearance", appearance);
        intent.putExtra("description", description);
        intent.putExtra("timeout", timeout);
        intent.putExtra("title", title);
        intent.putExtra("uid", uid);
        return intent;
    }

    public static Intent buildHideNotificationIntent(String uid) {
        Intent intent = new Intent(BroadcastAction.Type.HIDE_NOTIFICATION.getAction());
        intent.putExtra("uid", uid);
        return intent;
    }
}
