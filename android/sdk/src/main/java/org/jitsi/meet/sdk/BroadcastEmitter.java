package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.ReadableMap;

public class BroadcastEmitter {
    private final LocalBroadcastManager localBroadcastManager;

    public BroadcastEmitter(Context context) {
        localBroadcastManager = LocalBroadcastManager.getInstance(context);
    }

    public void sendBroadcast(String name, ReadableMap data) {
        BroadcastEvent event = new BroadcastEvent(name, data);

        Intent intent = event.buildIntent();

        if (intent != null) {
            localBroadcastManager.sendBroadcast(intent);
        }
    }
}
