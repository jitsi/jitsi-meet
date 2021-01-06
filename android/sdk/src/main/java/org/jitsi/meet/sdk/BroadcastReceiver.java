package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

public class BroadcastReceiver extends android.content.BroadcastReceiver {

    private static final String TAG = BroadcastReceiver.class.getSimpleName();

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

        if (actionName != null) {
            ReactInstanceManagerHolder.emitEvent(actionName, action.getDataAsWritableNativeMap());
        } else {
            JitsiMeetLogger.i(TAG + " invalid broadcast action");
        }
    }
}
