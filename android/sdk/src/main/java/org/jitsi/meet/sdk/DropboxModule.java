package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.text.TextUtils;

import com.dropbox.core.DbxException;
import com.dropbox.core.DbxRequestConfig;
import com.dropbox.core.android.Auth;
import com.dropbox.core.oauth.DbxCredential;
import com.dropbox.core.v2.DbxClientV2;
import com.dropbox.core.v2.users.FullAccount;
import com.dropbox.core.v2.users.SpaceAllocation;
import com.dropbox.core.v2.users.SpaceUsage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.HashMap;
import java.util.Map;

/**
 * Implements the react-native module for the dropbox integration.
 */
@ReactModule(name = DropboxModule.NAME)
class DropboxModule
        extends ReactContextBaseJavaModule
        implements LifecycleEventListener {

    public static final String NAME = "Dropbox";

    private String appKey;

    private String clientId;

    private final boolean isEnabled;

    private Promise promise;

    public DropboxModule(ReactApplicationContext reactContext) {
        super(reactContext);

        String pkg = reactContext.getApplicationContext().getPackageName();
        int resId = reactContext.getResources()
            .getIdentifier("dropbox_app_key", "string", pkg);
        appKey
            = reactContext.getString(resId);
        isEnabled = !TextUtils.isEmpty(appKey);

        clientId = generateClientId();

        reactContext.addLifecycleEventListener(this);
    }

    /**
     * Executes the dropbox auth flow.
     *
     * @param promise The promise used to return the result of the auth flow.
     */
    @ReactMethod
    public void authorize(final Promise promise) {
        if (isEnabled) {
            Auth.startOAuth2PKCE(this.getCurrentActivity(), appKey, DbxRequestConfig.newBuilder(clientId).build());
            this.promise = promise;
        } else {
            promise.reject(
                new Exception("Dropbox integration isn't configured."));
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

            applicationInfo = packageManager.getApplicationInfo(packageName, 0);
            packageInfo = packageManager.getPackageInfo(packageName, 0);
        } catch (PackageManager.NameNotFoundException e) {
        }

        String applicationLabel
            = applicationInfo == null
                ? "JitsiMeet"
                : packageManager.getApplicationLabel(applicationInfo).toString()
                    .replaceAll("\\s", "");
        String version = packageInfo == null ? "dev" : packageInfo.versionName;

        return applicationLabel + "/" + version;
    }

    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = new HashMap<>();

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
        DbxRequestConfig config = DbxRequestConfig.newBuilder(clientId).build();
        DbxClientV2 client = new DbxClientV2(config, token);

        // Get current account info
        try {
            FullAccount account = client.users().getCurrentAccount();

            promise.resolve(account.getName().getDisplayName());
        } catch (DbxException e) {
            promise.reject(e);
        }
    }

    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Resolves the current user space usage.
     *
     * @param token A dropbox access token.
     * @param promise The promise used to return the result of the auth flow.
     */
    @ReactMethod
    public void getSpaceUsage(final String token, final Promise promise) {
        DbxRequestConfig config = DbxRequestConfig.newBuilder(clientId).build();
        DbxClientV2 client = new DbxClientV2(config, token);

        try {
            SpaceUsage spaceUsage = client.users().getSpaceUsage();
            WritableMap map = Arguments.createMap();

            map.putString("used", String.valueOf(spaceUsage.getUsed()));

            SpaceAllocation allocation = spaceUsage.getAllocation();
            long allocated = 0;

            if (allocation.isIndividual()) {
                allocated += allocation.getIndividualValue().getAllocated();
            }
            if (allocation.isTeam()) {
                allocated += allocation.getTeamValue().getAllocated();
            }
            map.putString("allocated", String.valueOf(allocated));

            promise.resolve(map);
        } catch (DbxException e) {
            promise.reject(e);
        }
    }

    @Override
    public void onHostDestroy() {}

    @Override
    public void onHostPause() {}

    @Override
    public void onHostResume() {
        DbxCredential credential = Auth.getDbxCredential();

        if (this.promise != null ) {
            if (credential != null) {
                WritableMap result = Arguments.createMap();
                result.putString("token", credential.getAccessToken());
                result.putString("rToken", credential.getRefreshToken());
                result.putDouble("expireDate", credential.getExpiresAt());

                this.promise.resolve(result);
                this.promise = null;
            } else {
                this.promise.reject("Invalid dropbox credentials");
            }

            this.promise = null;
        }

    }
}
