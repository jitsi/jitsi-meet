import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const VIDEO_MUTE_CLASS = 'video-muted';

/**
 * React component for displaying video. This component defers to lib-jitsi-meet
 * logic for rendering the video.
 *
 * @extends Component
 */
class VideoInputPreview extends Component {
    /**
     * VideoInputPreview component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /*
         * The JitsiLocalTrack to display.
         */
        track: React.PropTypes.object
    }

    /**
     * Initializes a new VideoInputPreview instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._rootElement = null;
        this._videoElement = null;

        this._setRootElement = this._setRootElement.bind(this);
        this._setVideoElement = this._setVideoElement.bind(this);
    }

    /**
     * Invokes the library for rendering the video on initial display.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._attachTrack(this.props.track);
    }

    /**
     * Remove any existing associations between the current previewed track and
     * the component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._detachTrack(this.props.track);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'video-input-preview'
                ref = { this._setRootElement }>
                <video
                    autoPlay = { true }
                    className = 'video-input-preview-display flipVideoX'
                    ref = { this._setVideoElement } />
                <div className = 'video-input-preview-muted'>
                    { this.props.t('deviceSelection.currentlyVideoMuted') }
                </div>
            </div>
        );
    }

    /**
     * Only update when the deviceId has changed. This component is somewhat
     * black-boxed from React's rendering so lib-jitsi-meet can instead handle
     * updating of the video preview, which takes browser differences into
     * consideration. For example, temasys's video object must be visible to
     * update the displayed track, but React's re-rendering could potentially
     * remove the video object from the page.
     *
     * @inheritdoc
     * @returns {void}
     */
    shouldComponentUpdate(nextProps) {
        if (nextProps.track !== this.props.track) {
            this._detachTrack(this.props.track);
            this._attachTrack(nextProps.track);
        }

        return false;
    }

    /**
     * Calls into the passed in track to associate the track with the
     * component's video element and render video. Also sets the instance
     * variable for the video element as the element the track attached to,
     * which could be an Object if on a temasys supported browser.
     *
     * @param {JitsiLocalTrack} track - The library's track model which will be
     * displayed.
     * @private
     * @returns {void}
     */
    _attachTrack(track) {
        if (!track) {
            return;
        }

        // Do not attempt to display a preview if the track is muted, as the
        // library will simply return a falsy value for the element anyway.
        if (track.isMuted()) {
            this._showMuteOverlay(true);
        } else {
            this._showMuteOverlay(false);

            const updatedVideoElement = track.attach(this._videoElement);

            this._setVideoElement(updatedVideoElement);
        }
    }

    /**
     * Removes the association to the component's video element from the passed
     * in JitsiLocalTrack to stop the track from rendering. With temasys, the
     * video element must still be visible for detaching to complete.
     *
     * @param {JitsiLocalTrack} track - The library's track model which needs
     * to stop previewing in the video element.
     * @private
     * @returns {void}
     */
    _detachTrack(track) {
        // Detach the video element from the track only if it has already
        // been attached. This accounts for a special case with temasys
        // where if detach is being called before attach, the video
        // element is converted to Object without updating this
        // component's reference to the video element.
        if (this._videoElement
            && track
            && track.containers.includes(this._videoElement)) {
            track.detach(this._videoElement);
        }
    }

    /**
     * Sets the component's root element.
     *
     * @param {Object} element - The highest DOM element in the component.
     * @private
     * @returns {void}
     */
    _setRootElement(element) {
        this._rootElement = element;
    }

    /**
     * Sets an instance variable for the component's video element so it can be
     * referenced later for attaching and detaching a JitsiLocalTrack.
     *
     * @param {Object} element - DOM element for the component's video display.
     * @private
     * @returns {void}
     */
    _setVideoElement(element) {
        this._videoElement = element;
    }

    /**
     * Adds or removes a class to the component's parent node to indicate mute
     * status.
     *
     * @param {boolean} shouldShow - True if the mute class should be added and
     * false if the class should be removed.
     * @private
     * @returns {void}
     */
    _showMuteOverlay(shouldShow) {
        if (shouldShow) {
            this._rootElement.classList.add(VIDEO_MUTE_CLASS);
        } else {
            this._rootElement.classList.remove(VIDEO_MUTE_CLASS);
        }
    }
}

export default translate(VideoInputPreview);
