package org.jitsi.meet.sdk;

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

    public JMOngoingConferenceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void launchNotification() {
        Context context = getReactApplicationContext();

        JitsiMeetOngoingConferenceService.launch(context, null);
    }

    @ReactMethod
    public void abortNotification() {
        Context context = getReactApplicationContext();

        JitsiMeetOngoingConferenceService.abort(context);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
