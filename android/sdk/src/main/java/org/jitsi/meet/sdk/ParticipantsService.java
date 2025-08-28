package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.annotation.Nullable;

public class ParticipantsService extends android.content.BroadcastReceiver {

    private static final String TAG = ParticipantsService.class.getSimpleName();
    private static final String REQUEST_ID = "requestId";

    private final Map<String, WeakReference<ParticipantsInfoCallback>> participantsInfoCallbackMap = new HashMap<>();

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
        String callbackKey = UUID.randomUUID().toString();
        this.participantsInfoCallbackMap.put(callbackKey, new WeakReference<>(participantsInfoCallback));

        String actionName = BroadcastAction.Type.RETRIEVE_PARTICIPANTS_INFO.getAction();
        WritableMap data = Arguments.createMap();
        data.putString(REQUEST_ID, callbackKey);
        ReactInstanceManagerHolder.emitEvent(actionName, data);
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

                    ParticipantsInfoCallback participantsInfoCallback = this.participantsInfoCallbackMap.get(event.getData().get(REQUEST_ID).toString()).get();

                    if (participantsInfoCallback != null) {
                        participantsInfoCallback.onReceived(participantInfoList);
                        this.participantsInfoCallbackMap.remove(participantsInfoCallback);
                    }
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
