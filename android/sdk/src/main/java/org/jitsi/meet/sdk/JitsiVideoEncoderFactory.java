package org.jitsi.meet.sdk;

import androidx.annotation.Nullable;

import com.oney.WebRTCModule.webrtcutils.H264AndSoftwareVideoEncoderFactory;

import org.webrtc.EglBase;

/**
 * Custom encoder factory which uses HW for H.264 and SW for everything else.
 */
public class JitsiVideoEncoderFactory extends H264AndSoftwareVideoEncoderFactory {
    public JitsiVideoEncoderFactory(@Nullable EglBase.Context eglContext) {
        super(eglContext);
    }
}
