var RTCEvents = {
    RTC_READY: "rtc.ready",
    DATA_CHANNEL_OPEN: "rtc.data_channel_open",
    CREATE_OFFER_FAILED: "rtc.create_offer_failed",
    CREATE_ANSWER_FAILED: "rtc.create_answer_failed",
    SET_LOCAL_DESCRIPTION_FAILED: "rtc.set_local_description_failed",
    SET_REMOTE_DESCRIPTION_FAILED: "rtc.set_remote_description_failed",
    ADD_ICE_CANDIDATE_FAILED: "rtc.add_ice_candidate_failed",
    GET_USER_MEDIA_FAILED: "rtc.get_user_media_failed",
    LASTN_CHANGED: "rtc.lastn_changed",
    DOMINANTSPEAKER_CHANGED: "rtc.dominantspeaker_changed",
    LASTN_ENDPOINT_CHANGED: "rtc.lastn_endpoint_changed",
    AVAILABLE_DEVICES_CHANGED: "rtc.available_devices_changed",
    AUDIO_MUTE: "rtc.audio_mute",
    VIDEO_MUTE: "rtc.video_mute"
};

module.exports = RTCEvents;