import React, { Component } from 'react';

import { appNavigate } from '../../app';
import {
    toggleAudioMuted,
    toggleVideoMuted
} from '../../base/media';
import { ColorPalette } from '../../base/styles';

import { styles } from './styles';

/**
 * Abstract (base) class for the conference toolbar.
 *
 * @abstract
 */
export class AbstractToolbar extends Component {
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
     *      buttonStyle: Object,
     *      iconName: string,
     *      iconStyle: Object
     * }}
     */
    _getMuteButtonStyles(mediaType) {
        let buttonStyle;
        let iconName;
        let iconStyle;

        if (this.props[`${mediaType}Muted`]) {
            buttonStyle = {
                ...styles.toolbarButton,
                backgroundColor: ColorPalette.buttonUnderlay
            };
            iconName = this[`${mediaType}MutedIcon`];
            iconStyle = styles.whiteIcon;
        } else {
            buttonStyle = styles.toolbarButton;
            iconName = this[`${mediaType}Icon`];
            iconStyle = styles.icon;
        }

        return {
            buttonStyle,
            iconName,
            iconStyle
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
     * Dispatches action to toggle the mute state of the audio/microphone.
     *
     * @protected
     * @returns {void}
     */
    _toggleAudio() {
        this.props.dispatch(toggleAudioMuted());
    }

    /**
     * Dispatches action to toggle the mute state of the video/camera.
     *
     * @protected
     * @returns {void}
     */
    _toggleVideo() {
        this.props.dispatch(toggleVideoMuted());
    }
}

/**
 * AbstractToolbar component's property types.
 *
 * @static
 */
AbstractToolbar.propTypes = {
    audioMuted: React.PropTypes.bool,
    dispatch: React.PropTypes.func,
    videoMuted: React.PropTypes.bool,
    visible: React.PropTypes.bool.isRequired
};

/**
 * Maps parts of media state to component props.
 *
 * @param {Object} state - Redux state.
 * @returns {{ audioMuted: boolean, videoMuted: boolean }}
 */
export function mapStateToProps(state) {
    const media = state['features/base/media'];

    return {
        audioMuted: media.audio.muted,
        videoMuted: media.video.muted
    };
}
