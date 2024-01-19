package org.jitsi.meet.sdk;

import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;


@ReactModule(name = JitsiMeetMediaProjectionModule.NAME)
class JitsiMeetMediaProjectionModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "JitsiMeetMediaProjectionModule";

    public JitsiMeetMediaProjectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void launch() {
        Context context = getReactApplicationContext();

        JitsiMeetMediaProjectionService.launch(context);
    }

    @ReactMethod
    public void abort() {
        Context context = getReactApplicationContext();

        JitsiMeetMediaProjectionService.abort(context);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
