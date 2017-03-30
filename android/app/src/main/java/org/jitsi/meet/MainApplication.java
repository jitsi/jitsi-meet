package org.jitsi.meet;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        /**
         * {@inheritDoc}
         */
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        /**
         * {@inheritDoc}
         */
        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                new com.corbt.keepawake.KCKeepAwakePackage(),
                new com.facebook.react.shell.MainReactPackage(),
                new com.oblador.vectoricons.VectorIconsPackage(),
                new com.ocetnik.timer.BackgroundTimerPackage(),
                new com.oney.WebRTCModule.WebRTCModulePackage(),
                new com.rnimmersive.RNImmersivePackage(),
                new org.jitsi.meet.audiomode.AudioModePackage(),
                new org.jitsi.meet.proximity.ProximityPackage()
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

        SoLoader.init(this, /* native exopackage */ false);

        if (!getReactNativeHost()
                .getReactInstanceManager()
                    .getDevSupportManager()
                        .getDevSupportEnabled()) {
            // TODO Auto-generated method stub
        }
    }
}
