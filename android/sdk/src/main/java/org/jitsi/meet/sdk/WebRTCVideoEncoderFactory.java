package org.jitsi.meet.sdk;

import androidx.annotation.Nullable;

import org.webrtc.EglBase;
import org.webrtc.HardwareVideoEncoderFactory;
import org.webrtc.SoftwareVideoEncoderFactory;
import org.webrtc.VideoCodecInfo;
import org.webrtc.VideoEncoder;
import org.webrtc.VideoEncoderFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * This is a custom video encoder factory for WebRTC which behaves similarly
 * to the default one in iOS. It supports the following codecs:
 *
 * - In hardware: H.264 (baseline)
 * - In software: VP8, VP9, AV1
 */
public class WebRTCVideoEncoderFactory implements VideoEncoderFactory {
    private final VideoEncoderFactory hardwareVideoEncoderFactory;
    private final VideoEncoderFactory softwareVideoEncoderFactory = new SoftwareVideoEncoderFactory();

    public WebRTCVideoEncoderFactory(EglBase.Context eglContext) {
        this.hardwareVideoEncoderFactory =
            new HardwareVideoEncoderFactory(eglContext, false, false);
    }

    @Nullable
    @Override
    public VideoEncoder createEncoder(VideoCodecInfo codecInfo) {
        String codecName = codecInfo.name;

        if (codecName.equalsIgnoreCase(VideoCodecMimeType.VP8.name())) {
            return this.softwareVideoEncoderFactory.createEncoder(codecInfo);
        } else if (codecName.equalsIgnoreCase(VideoCodecMimeType.VP9.name())) {
            return this.softwareVideoEncoderFactory.createEncoder(codecInfo);
        } else if (codecName.equalsIgnoreCase(VideoCodecMimeType.AV1.name())) {
            return this.softwareVideoEncoderFactory.createEncoder(codecInfo);
        } else if (codecName.equalsIgnoreCase(VideoCodecMimeType.H264.name())) {
            return this.hardwareVideoEncoderFactory.createEncoder(codecInfo);
        }

        return null;
    }

    @Override
    public VideoCodecInfo[] getSupportedCodecs() {
        List<VideoCodecInfo> codecs = new ArrayList<>();

        codecs.add(new VideoCodecInfo(VideoCodecMimeType.VP8.name(), new HashMap<>()));
        codecs.add(new VideoCodecInfo(VideoCodecMimeType.VP9.name(), new HashMap<>()));
        codecs.add(H264Utils.DEFAULT_H264_BASELINE_PROFILE_CODEC);

        return codecs.toArray(new VideoCodecInfo[codecs.size()]);
    }
}
