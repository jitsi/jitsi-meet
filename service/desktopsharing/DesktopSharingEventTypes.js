var DesktopSharingEventTypes = {
    INIT: "ds.init",

    SWITCHING_DONE: "ds.switching_done",

    NEW_STREAM_CREATED: "ds.new_stream_created",

    /**
     * An event which indicates that the jidesha extension for Firefox is
     * needed to proceed with screen sharing, and that it is not installed.
     */
    FIREFOX_EXTENSION_NEEDED: "ds.firefox_extension_needed",

    EXTENSION_VERSION_ERROR: "ds.extesion_version_error",

    EXTENSION_INSTALLATION_ERROR: "ds.extesion_installation_error",

    EXTENSION_STREAM_ERROR: "ds.extesion_stream_error",

    VIDEOSTREAM_ERROR: "ds.video_stream_error"
};

module.exports = DesktopSharingEventTypes;
