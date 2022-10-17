package org.jisti.meet.sdk;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import org.devio.rn.splashscreen.SplashScreenModule;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class JitsiMeetReactNativePackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules 
            = new ArrayList<>(Arrays.<NativeModule>asList(
                new AndroidSettingsModule(reactContext),
                new AppInfoModule(reactContext),
                new AudioModeModule(reactContext),
                new DropboxModule(reactContext),
                new JavaScriptSandboxModule(reactContext),
                new LocaleDetector(reactContext),
                new LogBridgeModule(reactContext),
                new SplashScreenModule(reactContext),
                new PictureInPictureModule(reactContext),
                new ProximityModule(reactContext),
                new WiFiStatsModule(reactContext),
                new com.jitsimeetreactnative.net.NAT64AddrInfoModule(reactContext)
                ));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
