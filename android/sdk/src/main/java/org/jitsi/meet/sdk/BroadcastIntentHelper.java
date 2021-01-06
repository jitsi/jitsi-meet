package org.jitsi.meet.sdk;

import android.content.Intent;

public class BroadcastIntentHelper {
    public static Intent constructSetAudioMutedIntent() {
        Intent intent = new Intent(BroadcastAction.Type.SET_AUDIO_MUTED.getAction());
        intent.putExtra("muted", true);
        return intent;
    }
}
