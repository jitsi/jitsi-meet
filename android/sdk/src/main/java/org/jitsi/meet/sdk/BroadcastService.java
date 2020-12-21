package org.jitsi.meet.sdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class BroadcastService extends BroadcastReceiver {
    private final LocalBroadcastManager localBroadcastManager;

    private final int ID = (int) (Math.random() * Short.MAX_VALUE);

    public BroadcastService(Context context) {
        localBroadcastManager = LocalBroadcastManager.getInstance(context);

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastMessage.Type.SEND_MESSAGE.getAction());
        intentFilter.addAction(BroadcastMessage.Type.SET_AUDIO_MUTED.getAction());

        localBroadcastManager.registerReceiver(this, intentFilter);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        BroadcastMessage message = new BroadcastMessage(intent);

        String messageAction = message.getAction();

        /*
            In order to avoid ping-pong with messages, only the messages that
            were not emitted by this BroadcastService will be sent to JS.
        */
        if (messageAction != null && message.getEmitterId() != ID) {
            emitEvent(messageAction, message.getDataAsWritableNativeMap());
        }
    }

    private void emitEvent(String name, WritableNativeMap data) {
        ReactInstanceManagerHolder.emitEvent(name, data);
    }

    public void sendBroadcast(String name, ReadableMap data) {
        BroadcastMessage message = new BroadcastMessage(name, data, ID);

        Intent intent = message.buildIntent();

        if (intent != null) {
            localBroadcastManager.sendBroadcast(intent);
        }
    }
}
