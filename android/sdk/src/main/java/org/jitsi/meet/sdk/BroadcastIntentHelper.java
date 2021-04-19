package org.jitsi.meet.sdk;

import android.content.Intent;

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

    public static Intent buildToggleScreenShareIntent() {
        return new Intent(BroadcastAction.Type.TOGGLE_SCREEN_SHARE.getAction());
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
}
