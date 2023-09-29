export default {
    NICKNAME_CHANGED: 'UI.nickname_changed',

    /**
     * Notifies that local user changed email.
     */
    EMAIL_CHANGED: 'UI.email_changed',

    /**
     * Notifies that "start muted" settings changed.
     */
    AUDIO_MUTED: 'UI.audio_muted',
    VIDEO_MUTED: 'UI.video_muted',
    ETHERPAD_CLICKED: 'UI.etherpad_clicked',

    /**
     * Updates shared video with params: url, state, time(optional)
     * Where url is the video link, state is stop/start/pause and time is the
     * current video playing time.
     */
    TOGGLE_FULLSCREEN: 'UI.toogle_fullscreen',
    FULLSCREEN_TOGGLED: 'UI.fullscreen_toggled',

    /**
     * Notifies that the audio only mode was toggled.
     */
    TOGGLE_AUDIO_ONLY: 'UI.toggle_audioonly',

    /**
     * Notifies that a command to toggle the filmstrip has been issued. The
     * event may optionally specify a {Boolean} (primitive) value to assign to
     * the visibility of the filmstrip (i.e. the event may act as a setter).
     * The very toggling of the filmstrip may or may not occurred at the time
     * of the receipt of the event depending on the position of the receiving
     * event listener in relation to the event listener which carries out the
     * command to toggle the filmstrip.
     *
     * @see {TOGGLED_FILMSTRIP}
     */
    TOGGLE_FILMSTRIP: 'UI.toggle_filmstrip',

    HANGUP: 'UI.hangup',
    VIDEO_DEVICE_CHANGED: 'UI.video_device_changed',
    AUDIO_DEVICE_CHANGED: 'UI.audio_device_changed',

    /**
     * Notifies that the side toolbar container has been toggled. The actual
     * event must contain the identifier of the container that has been toggled
     * and information about toggle on or off.
     */
    SIDE_TOOLBAR_CONTAINER_TOGGLED: 'UI.side_container_toggled',

    /**
     * Notifies that the raise hand has been changed.
     */
    LOCAL_RAISE_HAND_CHANGED: 'UI.local_raise_hand_changed'
};
