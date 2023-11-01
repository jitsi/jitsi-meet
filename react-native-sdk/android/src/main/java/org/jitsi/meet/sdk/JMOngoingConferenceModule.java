package org.jitsi.meet.sdk;

import android.app.Notification;
import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;


@ReactModule(name = JMOngoingConferenceModule.NAME)
class JMOngoingConferenceModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "JMOngoingConference";

    private static JMOngoingConferenceModule jmOngoingConferenceModuleInstance;

    public JMOngoingConferenceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        jmOngoingConferenceModuleInstance = this;
    }

    static JMOngoingConferenceModule getInstance() {
        return jmOngoingConferenceModuleInstance;
    }

    Notification build() {
        Context context = getReactApplicationContext().getCurrentActivity();

        return RNOngoingNotification.buildOngoingConferenceNotification(context);
    }

    void create() {
        Context context = getReactApplicationContext().getCurrentActivity();

        RNOngoingNotification.createOngoingConferenceNotificationChannel(context);
    }

    @ReactMethod
    public void launch() {
        Context context = getReactApplicationContext();

        JitsiMeetOngoingConferenceService.launch(context);
    }

    @ReactMethod
    public void abort() {
        Context context = getReactApplicationContext();

        JitsiMeetOngoingConferenceService.abort(context);
    }

    @ReactMethod
    public void onCurrentConferenceChanged() {
        Context context = getReactApplicationContext();

        JitsiMeetOngoingConferenceService.onCurrentConferenceChanged(null, context);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
