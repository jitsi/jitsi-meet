package org.jitsi.meet.sdk;

import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;


@ReactModule(name = JMOngoingConferenceModule.NAME)
class JMOngoingConferenceModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "JMOngoingConference";
    private static final String JM_ONGOING_CONFERENCE_SERVICE
        = "org.jitsi.meet.sdk.JitsiMeetOngoingConferenceService";

    public OngoingConferenceModule (ReactApplicationContext reactContext) {
        super(reactContext);
    }

    public void createNotification() {
        Context context = getReactApplicationContext();
        Object JMOngoingConferenceService = getJMOngoingConferenceService();

        return JMOngoingConferenceService.onCreate(context);
    }

    public void launchNotification() {
        Context context = getReactApplicationContext();
        Object JMOngoingConferenceService = getJMOngoingConferenceService();

        return JMOngoingConferenceService.launch(context);
    }

    public void destroyNotification() {
        Object JMOngoingConferenceService = getJMOngoingConferenceService();

        return JMOngoingConferenceService.onDestroy();
    }

    public void abortNotification() {
        Context context = getReactApplicationContext();
        Object JMOngoingConferenceService = getJMOngoingConferenceService();

        return JMOngoingConferenceService.abort(context);
    }

    private static Object getJMOngoingConferenceService() {
        try {
            Class<?> c = Class.forName(JM_ONGOING_CONFERENCE_SERVICE);
            c.getClass();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
