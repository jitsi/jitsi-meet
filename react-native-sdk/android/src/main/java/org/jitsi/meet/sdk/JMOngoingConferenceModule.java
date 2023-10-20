package org.jitsi.meet.sdk;

import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;


@ReactModule(name = JMOngoingConferenceModule.NAME)
class JMOngoingConferenceModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "JMOngoingConference";

    public JMOngoingConferenceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    public void createNotification() {
        Context context = getReactApplicationContext();
        JitsiMeetOngoingConferenceService module
            = JitsiMeetOngoingConferenceService.getInstance();

        if (module !=null) {
            module.onCreate(context);
        }
    }

    public void launchNotification() {
        Context context = getReactApplicationContext();
        JitsiMeetOngoingConferenceService module
            = JitsiMeetOngoingConferenceService.getInstance();

        if (module !=null) {
            module.launch(context, null);
        }
    }

    public void destroyNotification() {
        JitsiMeetOngoingConferenceService module
            = JitsiMeetOngoingConferenceService.getInstance();

        if (module !=null) {
            module.onDestroy();
        }
    }

    public void abortNotification() {
        Context context = getReactApplicationContext();
        JitsiMeetOngoingConferenceService module
            = JitsiMeetOngoingConferenceService.getInstance();

        if (module !=null) {
            module.abort(context);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
