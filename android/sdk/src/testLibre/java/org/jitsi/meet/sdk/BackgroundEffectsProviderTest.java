package org.jitsi.meet.sdk;

import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;

public class BackgroundEffectsProviderTest {
    @Test
    public void libreProviderLeavesCameraProcessingUntouchedAndExportsNoModule() {
        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        WebRTCModuleOptions.CameraVideoProcessorFactory original = options.cameraVideoProcessorFactory;
        WebRTCModuleOptions.CameraVideoProcessorFactory[] factories = {
            null,
            textureHelper -> { throw new AssertionError("Libre provider must not create a video processor"); }
        };
        try {
            for (WebRTCModuleOptions.CameraVideoProcessorFactory factory : factories) {
                options.cameraVideoProcessorFactory = factory;
                BackgroundEffectsProvider.initialize(null);
                assertNull(BackgroundEffectsProvider.createNativeModule(null));
                assertEquals(0, BackgroundEffectsProvider.claimOwner(null, "view"));
                assertEquals(0, BackgroundEffectsProvider.advanceOwner(null, "view"));
                BackgroundEffectsProvider.releaseOwner(null, "view");
                assertSame(factory, options.cameraVideoProcessorFactory);
            }
        } finally {
            options.cameraVideoProcessorFactory = original;
        }
    }
}
