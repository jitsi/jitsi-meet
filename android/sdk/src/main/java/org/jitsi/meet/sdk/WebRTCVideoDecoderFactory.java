package org.jitsi.meet.sdk;

import androidx.annotation.Nullable;

import org.webrtc.EglBase;
import org.webrtc.HardwareVideoDecoderFactory;
import org.webrtc.SoftwareVideoDecoderFactory;
import org.webrtc.VideoCodecInfo;
import org.webrtc.VideoDecoder;
import org.webrtc.VideoDecoderFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * This is a custom video decoder factory for WebRTC which behaves similarly
 * to the default one in iOS. It supports the following codecs:
 *
 * - In hardware: H.264 (baseline)
 * - In software: VP8, VP9, AV1
 */
public class WebRTCVideoDecoderFactory implements VideoDecoderFactory {
    private final VideoDecoderFactory hardwareVideoDecoderFactory;
    private final VideoDecoderFactory softwareVideoDecoderFactory = new SoftwareVideoDecoderFactory();

    public WebRTCVideoDecoderFactory(@Nullable EglBase.Context eglContext) {
        this.hardwareVideoDecoderFactory = new HardwareVideoDecoderFactory(eglContext);
    }

    @Nullable
    @Override
    public VideoDecoder createDecoder(VideoCodecInfo codecInfo) {
        if (codecInfo.name.equalsIgnoreCase(VideoCodecMimeType.H264.name())) {
            return this.hardwareVideoDecoderFactory.createDecoder(codecInfo);
        }

        return this.softwareVideoDecoderFactory.createDecoder(codecInfo);
    }

    @Override
    public VideoCodecInfo[] getSupportedCodecs() {
        List<VideoCodecInfo> codecs = new ArrayList<>();

        codecs.add(new VideoCodecInfo(VideoCodecMimeType.VP8.name(), new HashMap<>()));
        codecs.add(new VideoCodecInfo(VideoCodecMimeType.VP9.name(), new HashMap<>()));
        codecs.add(new VideoCodecInfo(VideoCodecMimeType.AV1.name(), new HashMap<>()));
        codecs.add(H264Utils.DEFAULT_H264_BASELINE_PROFILE_CODEC);

        return codecs.toArray(new VideoCodecInfo[codecs.size()]);
    }
}
