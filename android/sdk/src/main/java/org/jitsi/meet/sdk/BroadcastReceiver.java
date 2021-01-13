package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

/**
 * Listens for {@link BroadcastAction}s on LocalBroadcastManager. When one occurs,
 * it emits it to JS.
 */
public class BroadcastReceiver extends android.content.BroadcastReceiver {

    public BroadcastReceiver(Context context) {
        LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(context);

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastAction.Type.SET_AUDIO_MUTED.getAction());
        intentFilter.addAction(BroadcastAction.Type.HANG_UP.getAction());

        localBroadcastManager.registerReceiver(this, intentFilter);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        BroadcastAction action = new BroadcastAction(intent);
        String actionName = action.getType().getAction();

        ReactInstanceManagerHolder.emitEvent(actionName, action.getDataAsWritableNativeMap());
    }
}
