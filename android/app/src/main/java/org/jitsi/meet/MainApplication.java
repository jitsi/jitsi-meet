package org.jitsi.meet;

import android.app.Application;

import com.crashlytics.android.Crashlytics;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;

import io.fabric.sdk.android.Fabric;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        /**
         * {@inheritDoc}
         */
        @Override
        protected boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        /**
         * {@inheritDoc}
         */
        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                new com.facebook.react.shell.MainReactPackage(),
                new com.oblador.vectoricons.VectorIconsPackage(),
                new com.oney.WebRTCModule.WebRTCModulePackage()
            );
        }
    };

    /**
     * {@inheritDoc}
     */
    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void onCreate() {
        super.onCreate();

        if (!getReactNativeHost()
                .getReactInstanceManager()
                    .getDevSupportManager()
                        .getDevSupportEnabled()) {
            Fabric.with(this, new Crashlytics());
        }
    }
}
