package org.jitsi.meet.sdk.dropbox;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.text.TextUtils;
import android.util.Log;

import com.dropbox.core.DbxException;
import com.dropbox.core.DbxRequestConfig;
import com.dropbox.core.v2.DbxClientV2;
import com.dropbox.core.v2.users.FullAccount;
import com.dropbox.core.v2.users.SpaceAllocation;
import com.dropbox.core.v2.users.SpaceUsage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.dropbox.core.android.Auth;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import org.jitsi.meet.sdk.R;

import java.util.HashMap;
import java.util.Map;

/**
 * Implements the react-native module for the dropbox integration.
 */
public class Dropbox extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private Promise promise = null;
    private String clientId;
    private String appID;
    private boolean isEnabled = false;

    public Dropbox(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addLifecycleEventListener(this);
        clientId = generateClientId();
        appID = reactContext.getString(R.string.dropbox_app_key);
        if (!TextUtils.isEmpty(appID)) {
            isEnabled = true;
        }
    }

    @Override
    public String getName() {
        return "Dropbox";
    }

    /**
     * Executes the dropbox auth flow.
     *
     * @param promise The promise used to return the result of the auth flow.
     */
    @ReactMethod
    public void authorize(final Promise promise) {
        if (!isEnabled) {
            promise.reject(new Exception("Dropbox integration isn't configured."));
            return;
        }
        Auth.startOAuth2Authentication(this.getCurrentActivity(), appID);
        this.promise = promise;
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("ENABLED", isEnabled);
        return constants;
    }


    /**
     * Resolves the current user dropbox display name.
     *
     * @param token A dropbox access token.
     * @param promise The promise used to return the result of the auth flow.
     */
    @ReactMethod
    public void getDisplayName(final String token, final Promise promise) {
        DbxRequestConfig config
            = DbxRequestConfig.newBuilder(clientId).build();
        DbxClientV2 client = new DbxClientV2(config, token);
        // Get current account info
        try {
            FullAccount account = client.users().getCurrentAccount();
            promise.resolve(account.getName().getDisplayName());
        } catch (DbxException e) {
            promise.reject(e);
        }
    }

    /**
     * Resolves the current user space usage.
     *
     * @param token A dropbox access token.
     * @param promise The promise used to return the result of the auth flow.
     */
    @ReactMethod
    public void getSpaceUsage(final String token, final Promise promise) {
        DbxRequestConfig config
            = DbxRequestConfig.newBuilder(clientId).build();
        DbxClientV2 client = new DbxClientV2(config, token);
        try {
            SpaceUsage spaceUsage = client.users().getSpaceUsage();
            WritableMap map = Arguments.createMap();
            map.putString("used", String.valueOf(spaceUsage.getUsed()));
            SpaceAllocation allocation = spaceUsage.getAllocation();
            long allocated = 0;
            if(allocation.isIndividual()) {
                allocated += allocation.getIndividualValue().getAllocated();
            }

            if(allocation.isTeam()) {
                allocated += allocation.getTeamValue().getAllocated();
            }
            map.putString("allocated", String.valueOf(allocated));
            promise.resolve(map);
        } catch (DbxException e) {
            promise.reject(e);
        }
    }

    /**
     * Generate a client identifier for the dropbox sdk.
     *
     * @returns a client identifier for the dropbox sdk.
     * @see {https://dropbox.github.io/dropbox-sdk-java/api-docs/v3.0.x/com/dropbox/core/DbxRequestConfig.html#getClientIdentifier--}
     */
    private String generateClientId() {
        Context context = getReactApplicationContext();
        PackageManager packageManager = context.getPackageManager();
        ApplicationInfo applicationInfo = null;
        PackageInfo packageInfo = null;

        try {
            String packageName = context.getPackageName();

            applicationInfo
                    = packageManager.getApplicationInfo(packageName, 0);
            packageInfo = packageManager.getPackageInfo(packageName, 0);
        } catch (PackageManager.NameNotFoundException e) {
        }

        String applicationLabel
            = applicationInfo == null
                ? "JitsiMeet"
                    : packageManager.getApplicationLabel(applicationInfo)
                        .toString().replaceAll("\\s", "");
        String version = packageInfo == null ? "dev" : packageInfo.versionName;

       return applicationLabel + "/" + version;
    }

    @Override
    public void onHostResume() {
        final String token = Auth.getOAuth2Token();
        if (token == null)
            return;

        if (this.promise != null) {
            this.promise.resolve(token);
            this.promise = null;
        }
    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {

    }
}
