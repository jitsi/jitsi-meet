package org.jitsi.meet.sdk;

/*
 *  Copyright 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. An additional intellectual property rights grant can be found
 *  in the file PATENTS.  All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

import androidx.annotation.Nullable;

import com.oney.WebRTCModule.webrtcutils.SoftwareVideoDecoderFactoryProxy;

import org.webrtc.EglBase;
import org.webrtc.HardwareVideoDecoderFactory;
import org.webrtc.PlatformSoftwareVideoDecoderFactory;
import org.webrtc.VideoCodecInfo;
import org.webrtc.VideoDecoder;
import org.webrtc.VideoDecoderFactory;
import org.webrtc.VideoDecoderFallback;

import java.util.Arrays;
import java.util.LinkedHashSet;

/**
 * Custom decoder factory which uses HW decoders and falls back to SW.
 */
public class JitsiVideoDecoderFactory implements VideoDecoderFactory {
    private final VideoDecoderFactory hardwareVideoDecoderFactory;
    private final VideoDecoderFactory softwareVideoDecoderFactory = new SoftwareVideoDecoderFactoryProxy();
    private final @Nullable VideoDecoderFactory platformSoftwareVideoDecoderFactory;

    /**
     * Create decoder factory using default hardware decoder factory.
     */
    public JitsiVideoDecoderFactory(@Nullable EglBase.Context eglContext) {
        this.hardwareVideoDecoderFactory = new HardwareVideoDecoderFactory(eglContext);
        this.platformSoftwareVideoDecoderFactory = new PlatformSoftwareVideoDecoderFactory(eglContext);
    }

    /**
     * Create decoder factory using explicit hardware decoder factory.
     */
    JitsiVideoDecoderFactory(VideoDecoderFactory hardwareVideoDecoderFactory) {
        this.hardwareVideoDecoderFactory = hardwareVideoDecoderFactory;
        this.platformSoftwareVideoDecoderFactory = null;
    }

    @Override
    public @Nullable VideoDecoder createDecoder(VideoCodecInfo codecType) {
        VideoDecoder softwareDecoder = softwareVideoDecoderFactory.createDecoder(codecType);
        final VideoDecoder hardwareDecoder = hardwareVideoDecoderFactory.createDecoder(codecType);
        if (softwareDecoder == null && platformSoftwareVideoDecoderFactory != null) {
            softwareDecoder = platformSoftwareVideoDecoderFactory.createDecoder(codecType);
        }
        if (hardwareDecoder != null && softwareDecoder != null) {
            // Both hardware and software supported, wrap it in a software fallback
            return new VideoDecoderFallback(
                /* fallback= */ softwareDecoder, /* primary= */ hardwareDecoder);
        }
        return hardwareDecoder != null ? hardwareDecoder : softwareDecoder;
    }

    @Override
    public VideoCodecInfo[] getSupportedCodecs() {
        LinkedHashSet<VideoCodecInfo> supportedCodecInfos = new LinkedHashSet<>();

        supportedCodecInfos.addAll(Arrays.asList(softwareVideoDecoderFactory.getSupportedCodecs()));
        supportedCodecInfos.addAll(Arrays.asList(hardwareVideoDecoderFactory.getSupportedCodecs()));
        if (platformSoftwareVideoDecoderFactory != null) {
            supportedCodecInfos.addAll(
                Arrays.asList(platformSoftwareVideoDecoderFactory.getSupportedCodecs()));
        }

        return supportedCodecInfos.toArray(new VideoCodecInfo[supportedCodecInfos.size()]);
    }
}
