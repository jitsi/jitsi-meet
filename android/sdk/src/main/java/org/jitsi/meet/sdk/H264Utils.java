/*
 *  Copyright 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. An additional intellectual property rights grant can be found
 *  in the file PATENTS.  All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

package org.jitsi.meet.sdk;

import org.webrtc.VideoCodecInfo;

import java.util.Map;
import java.util.HashMap;

/** Container for static helper functions related to dealing with H264 codecs. */
class H264Utils {
    public static final String H264_FMTP_PROFILE_LEVEL_ID = "profile-level-id";
    public static final String H264_FMTP_LEVEL_ASYMMETRY_ALLOWED = "level-asymmetry-allowed";
    public static final String H264_FMTP_PACKETIZATION_MODE = "packetization-mode";

    public static final String H264_PROFILE_CONSTRAINED_BASELINE = "42e0";
    public static final String H264_PROFILE_CONSTRAINED_HIGH = "640c";
    public static final String H264_LEVEL_3_1 = "1f"; // 31 in hex.
    public static final String H264_CONSTRAINED_HIGH_3_1 =
        H264_PROFILE_CONSTRAINED_HIGH + H264_LEVEL_3_1;
    public static final String H264_CONSTRAINED_BASELINE_3_1 =
        H264_PROFILE_CONSTRAINED_BASELINE + H264_LEVEL_3_1;

    public static Map<String, String> getDefaultH264Params(boolean isHighProfile) {
        final Map<String, String> params = new HashMap<>();
        params.put(VideoCodecInfo.H264_FMTP_LEVEL_ASYMMETRY_ALLOWED, "1");
        params.put(VideoCodecInfo.H264_FMTP_PACKETIZATION_MODE, "1");
        params.put(VideoCodecInfo.H264_FMTP_PROFILE_LEVEL_ID,
            isHighProfile ? VideoCodecInfo.H264_CONSTRAINED_HIGH_3_1
                : VideoCodecInfo.H264_CONSTRAINED_BASELINE_3_1);
        return params;
    }

    public static VideoCodecInfo DEFAULT_H264_BASELINE_PROFILE_CODEC =
        new VideoCodecInfo("H264", getDefaultH264Params(/* isHighProfile= */ false));
    public static VideoCodecInfo DEFAULT_H264_HIGH_PROFILE_CODEC =
        new VideoCodecInfo("H264", getDefaultH264Params(/* isHighProfile= */ true));
}
