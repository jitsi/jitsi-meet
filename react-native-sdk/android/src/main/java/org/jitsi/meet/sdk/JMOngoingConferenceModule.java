package org.jitsi.meet.sdk;
import android.app.Activity;
import android.content.Context;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


/**
 * This class implements a ReactModule and it's
 * responsible for launching/aborting a service when a conference is in progress.
 */
@ReactModule(name = JMOngoingConferenceModule.NAME)
class JMOngoingConferenceModule extends ReactContextBaseJavaModule {

    public static final String NAME = "JMOngoingConference";

    public JMOngoingConferenceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void launch() {
        Context context = getReactApplicationContext();
        Activity currentActivity = getCurrentActivity();
        JMOngoingConferenceService.launch(context, currentActivity);
        JitsiMeetLogger.w(NAME + " Module launch");
    }

    @ReactMethod
    public void abort() {
        Context context = getReactApplicationContext();
        JMOngoingConferenceService.abort(context);
        JitsiMeetLogger.w(NAME + " Module abort");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
