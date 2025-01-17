package org.jitsi.meet.sdk;

import static android.Manifest.permission.POST_NOTIFICATIONS;
import static android.Manifest.permission.RECORD_AUDIO;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.ReactActivity;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


/**
 * This class implements a ReactModule and it's
 * responsible for launching/aborting a service when a conference is in progress.
 */
@ReactModule(name = JMOngoingConferenceModule.NAME)
class JMOngoingConferenceModule extends ReactContextBaseJavaModule {

    public static final String NAME = "JMOngoingConference";

    private static final int PERMISSIONS_REQUEST_CODE = (int) (Math.random() * Short.MAX_VALUE);

    public JMOngoingConferenceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void launch() {
        Context context = getReactApplicationContext();
        ReactActivity reactActivity = (ReactActivity) getCurrentActivity();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JMOngoingConferenceService.launch(context);

            JitsiMeetLogger.i(NAME + " launch");

            return;
        }

        PermissionListener listener = new PermissionListener() {
            @Override
            public boolean onRequestPermissionsResult(int i, String[] strings, int[] results) {
                JitsiMeetLogger.i(NAME + " Permission callback received");

                if (results == null || results.length == 0) {
                    JitsiMeetLogger.w(NAME + " Permission results are null or empty");
                    return true;
                }

                int counter = 0;
                for (int result : results) {
                    if (result == PackageManager.PERMISSION_GRANTED) {
                        counter++;
                    }
                }

                JitsiMeetLogger.i(NAME + " Permissions granted: " + counter + "/" + results.length);

                if (counter == results.length) {
                    JitsiMeetLogger.i(NAME + " All permissions granted, launching service");
                    JMOngoingConferenceService.launch(context);
                } else {
                    JitsiMeetLogger.w(NAME + " Not all permissions were granted");
                }

                return true;
            }
        };

        JitsiMeetLogger.i(NAME + " Checking Tiramisu permissions");

        List<String> permissionsList = new ArrayList<>();

        permissionsList.add(POST_NOTIFICATIONS);
        permissionsList.add(RECORD_AUDIO);

        String[] permissionsArray = new String[ permissionsList.size() ];
        permissionsArray = permissionsList.toArray( permissionsArray );

        try {
            JitsiMeetLogger.i(NAME + " Requesting permissions: " + Arrays.toString(permissionsArray));
            reactActivity.requestPermissions(permissionsArray, PERMISSIONS_REQUEST_CODE, listener);
        } catch (Exception e) {
            JitsiMeetLogger.e(e, NAME + " Error requesting permissions");
        }
    }

    @ReactMethod
    public void abort() {
        Context context = getReactApplicationContext();
        JMOngoingConferenceService.abort(context);

        JitsiMeetLogger.i(NAME + " abort");
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }
}
