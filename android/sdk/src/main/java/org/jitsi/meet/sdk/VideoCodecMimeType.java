package org.jitsi.meet.sdk;

/** Enumeration of supported video codec types. */
public enum VideoCodecMimeType {
    VP8("video/x-vnd.on2.vp8"),
    VP9("video/x-vnd.on2.vp9"),
    H264("video/avc"),
    AV1("video/av01");

    private final String mimeType;

    private VideoCodecMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    String mimeType() {
        return mimeType;
    }
}
