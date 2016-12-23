import React, { Component } from 'react';

import { appNavigate } from '../../app';
import { toggleAudioMuted, toggleVideoMuted } from '../../base/media';
import { ColorPalette } from '../../base/styles';
import { beginRoomLockRequest } from '../../room-lock';

import { styles } from './styles';

/**
 * Abstract (base) class for the conference toolbar.
 *
 * @abstract
 */
export class AbstractToolbar extends Component {
    /**
     * AbstractToolbar component's property types.
     *
     * @static
     */
    static propTypes = {
        audioMuted: React.PropTypes.bool,
        dispatch: React.PropTypes.func,

        /**
         * The indicator which determines whether the conference is
         * locked/password-protected.
         */
        locked: React.PropTypes.bool,
        videoMuted: React.PropTypes.bool,
        visible: React.PropTypes.bool.isRequired
    }

    /**
     * Initializes a new AbstractToolbar instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onHangup = this._onHangup.bind(this);
        this._onRoomLock = this._onRoomLock.bind(this);
        this._toggleAudio = this._toggleAudio.bind(this);
        this._toggleVideo = this._toggleVideo.bind(this);
    }

    /**
     * Gets the styles for a button that toggles the mute state of a specific
     * media type.
     *
     * @param {string} mediaType - The {@link MEDIA_TYPE} associated with the
     * button to get styles for.
     * @protected
     * @returns {{
     *      iconName: string,
     *      iconStyle: Object,
     *      style: Object
     * }}
     */
    _getMuteButtonStyles(mediaType) {
        let iconName;
        let iconStyle;
        let style = styles.primaryToolbarButton;

        if (this.props[`${mediaType}Muted`]) {
            iconName = this[`${mediaType}MutedIcon`];
            iconStyle = styles.whiteIcon;
            style = {
                ...style,
                backgroundColor: ColorPalette.buttonUnderlay
            };
        } else {
            iconName = this[`${mediaType}Icon`];
            iconStyle = styles.icon;
        }

        return {
            iconName,
            iconStyle,
            style
        };
    }

    /**
     * Dispatches action to leave the current conference.
     *
     * @protected
     * @returns {void}
     */
    _onHangup() {
        // XXX We don't know here which value is effectively/internally used
        // when there's no valid room name to join. It isn't our business to
        // know that anyway. The undefined value is our expression of (1) the
        // lack of knowledge & (2) the desire to no longer have a valid room
        // name to join.
        this.props.dispatch(appNavigate(undefined));
    }

    /**
     * Dispatches an action to set the lock i.e. password protection of the
     * conference/room.
     *
     * @protected
     * @returns {void}
     */
    _onRoomLock() {
        this.props.dispatch(beginRoomLockRequest());
    }

    /**
     * Dispatches an action to toggle the mute state of the audio/microphone.
     *
     * @protected
     * @returns {void}
     */
    _toggleAudio() {
        this.props.dispatch(toggleAudioMuted());
    }

    /**
     * Dispatches an action to toggle the mute state of the video/camera.
     *
     * @protected
     * @returns {void}
     */
    _toggleVideo() {
        this.props.dispatch(toggleVideoMuted());
    }
}

/**
 * Maps parts of media state to component props.
 *
 * @param {Object} state - Redux state.
 * @returns {{ audioMuted: boolean, videoMuted: boolean }}
 */
export function mapStateToProps(state) {
    const conference = state['features/base/conference'];
    const media = state['features/base/media'];

    return {
        audioMuted: media.audio.muted,

        /**
         * The indicator which determines whether the conference is
         * locked/password-protected.
         *
         * @type {boolean}
         */
        locked: conference.locked,
        videoMuted: media.video.muted
    };
}
