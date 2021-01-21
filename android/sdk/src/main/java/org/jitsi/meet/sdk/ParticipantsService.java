package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Nullable;

public class ParticipantsService extends android.content.BroadcastReceiver {

    private static final String TAG = ParticipantsService.class.getSimpleName();

    private ParticipantsInfoCallback participantsInfoCallback;

    private static ParticipantsService instance;

    @Nullable
    public static ParticipantsService getInstance() {
        return instance;
    }

    private ParticipantsService(Context context) {
        LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(context);

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.PARTICIPANTS_INFO_RETRIEVED.getAction());
        localBroadcastManager.registerReceiver(this, intentFilter);
    }

    static void init(Context context) {
        instance = new ParticipantsService(context);
    }

    public void retrieveParticipantsInfo(ParticipantsInfoCallback participantsInfoCallback) {
        this.participantsInfoCallback = participantsInfoCallback;

        String actionName = BroadcastAction.Type.RETRIEVE_PARTICIPANTS_INFO.getAction();
        ReactInstanceManagerHolder.emitEvent(actionName, null);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        BroadcastEvent event = new BroadcastEvent(intent);

        switch (event.getType()) {
            case PARTICIPANTS_INFO_RETRIEVED:
                try {
                    List<ParticipantInfo> participantInfoList = new Gson().fromJson(
                        event.getData().get("participantsInfo").toString(),
                        new TypeToken<ArrayList<ParticipantInfo>>() {
                        }.getType());

                    this.participantsInfoCallback.onReceived(participantInfoList);
                    Log.i("sdasdasdasdasdasd","dd");
                } catch (Exception e) {
                    JitsiMeetLogger.w(TAG + "error parsing participantsList", e);
                }

                break;
        }
    }

    public interface ParticipantsInfoCallback {
        void onReceived(List<ParticipantInfo> participantInfoList);
    }
}
