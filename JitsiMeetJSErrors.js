module.exports = {
    /**
     * Returns JitsiMeetJSError based on the error object passed by GUM
     * @param error the error
     * @param {Object} options the options object given to GUM.
     */
    parseError: function (error, options) {
        options = options || {};
        if (typeof error == "object" && error.constraintName && error.name
            && (error.name == "ConstraintNotSatisfiedError" ||
            error.name == "OverconstrainedError") &&
            (error.constraintName == "minWidth" ||
            error.constraintName == "maxWidth" ||
            error.constraintName == "minHeight" ||
            error.constraintName == "maxHeight") &&
            options.devices.indexOf("video") !== -1) {
                return this.GET_TRACKS_RESOLUTION;
        } else {
            return this.GET_TRACKS_GENERAL;
        }
    },
    GET_TRACKS_RESOLUTION: "gum.get_tracks_resolution",
    GET_TRACKS_GENERAL: "gum.get_tracks_general"
};
