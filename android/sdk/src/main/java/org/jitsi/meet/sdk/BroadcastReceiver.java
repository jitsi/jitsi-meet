package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

/**
 * Listens for {@link BroadcastAction}s on LocalBroadcastManager. When one occurs,
 * it emits it to JS.
 */
public class BroadcastReceiver extends android.content.BroadcastReceiver {

    public BroadcastReceiver(Context context) {
        LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(context);

        IntentFilter intentFilter = new IntentFilter();

        for (BroadcastAction.Type type : BroadcastAction.Type.values()) {
            intentFilter.addAction(type.getAction());
        }

        localBroadcastManager.registerReceiver(this, intentFilter);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        BroadcastAction action = new BroadcastAction(intent);
        String actionName = action.getType().getAction();
        Bundle data = action.getData();
            
        // For actions without data bundle (like hangup), we create an empty map
        // instead of attempting to convert a null bundle to avoid crashes.
        if (data != null) {
            ReactInstanceManagerHolder.emitEvent(actionName, Arguments.fromBundle(data));
        } else {
            ReactInstanceManagerHolder.emitEvent(actionName, Arguments.createMap());
        }
    }
}
