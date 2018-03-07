// @flow

import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { toggleAudioOnly } from '../../base/conference';
import {
    MEDIA_TYPE,
    toggleCameraFacingMode
} from '../../base/media';
import { Container } from '../../base/react';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';
import {
    EnterPictureInPictureToolbarButton
} from '../../mobile/picture-in-picture';
import { beginRoomLockRequest } from '../../room-lock';
import { beginShareRoom } from '../../share-room';

import {
    abstractMapDispatchToProps,
    abstractMapStateToProps
} from '../functions';

import AudioRouteButton from './AudioRouteButton';
import styles from './styles';
import ToolbarButton from './ToolbarButton';

import { AudioMuteButton, HangupButton, VideoMuteButton } from './buttons';

/**
 * The indicator which determines (at bundle time) whether there should be a
 * {@code ToolbarButton} in {@code Toolbox} to expose the functionality of the
 * feature share-room in the user interface of the app.
 *
 * @private
 * @type {boolean}
 */
const _SHARE_ROOM_TOOLBAR_BUTTON = true;

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
type Props = {

    /**
     * Flag showing that audio is muted.
     */
    _audioMuted: boolean,

    /**
     * Flag showing whether the audio-only mode is in use.
     */
    _audioOnly: boolean,

    /**
     * The indicator which determines whether the toolbox is enabled.
     */
    _enabled: boolean,

    /**
     * Flag showing whether room is locked.
     */
    _locked: boolean,

    /**
     * Handler for hangup.
     */
    _onHangup: Function,

    /**
     * Sets the lock i.e. password protection of the conference/room.
     */
    _onRoomLock: Function,

    /**
     * Begins the UI procedure to share the conference/room URL.
     */
    _onShareRoom: Function,

    /**
     * Toggles the audio-only flag of the conference.
     */
    _onToggleAudioOnly: Function,

    /**
     * Switches between the front/user-facing and back/environment-facing
     * cameras.
     */
    _onToggleCameraFacingMode: Function,

    /**
     * Flag showing whether video is muted.
     */
    _videoMuted: boolean,

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean,

    dispatch: Function
};


/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._enabled) {
            return null;
        }

        const toolboxStyle
            = isNarrowAspectRatio(this)
                ? styles.toolboxNarrow
                : styles.toolboxWide;

        return (
            <Container
                style = { toolboxStyle }
                visible = { this.props._visible } >
                { this._renderToolbars() }
            </Container>
        );
    }

    /**
     * Gets the styles for a button that toggles the mute state of a specific
     * media type.
     *
     * @param {string} mediaType - The {@link MEDIA_TYPE} associated with the
     * button to get styles for.
     * @protected
     * @returns {{
     *     iconName: string,
     *     iconStyle: Object,
     *     style: Object
     * }}
     */
    _getMuteButtonStyles(mediaType) {
        let iconName;
        let iconStyle;
        let style;

        if (this.props[`_${mediaType}Muted`]) {
            iconName = `${mediaType}MutedIcon`;
            iconStyle = styles.whitePrimaryToolbarButtonIcon;
            style = styles.whitePrimaryToolbarButton;
        } else {
            iconName = `${mediaType}Icon`;
            iconStyle = styles.primaryToolbarButtonIcon;
            style = styles.primaryToolbarButton;
        }

        return {

            // $FlowExpectedError
            iconName: this[iconName],
            iconStyle,
            style
        };
    }

    /**
     * Renders the toolbar which contains the primary buttons such as hangup,
     * audio and video mute.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPrimaryToolbar() {
        const audioButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.AUDIO);
        const videoButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.VIDEO);

        /* eslint-disable react/jsx-handler-names */

        return (
            <View
                key = 'primaryToolbar'
                style = { styles.primaryToolbar }>
                <AudioMuteButton buttonStyles = { audioButtonStyles } />
                <HangupButton />
                <VideoMuteButton buttonStyles = { videoButtonStyles } />
            </View>
        );

        /* eslint-enable react/jsx-handler-names */
    }

    /**
     * Renders the toolbar which contains the secondary buttons such as toggle
     * camera facing mode.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSecondaryToolbar() {
        const iconStyle = styles.secondaryToolbarButtonIcon;
        const style = styles.secondaryToolbarButton;
        const underlayColor = 'transparent';
        const {
            _audioOnly: audioOnly,
            _videoMuted: videoMuted
        } = this.props;

        /* eslint-disable react/jsx-curly-spacing,react/jsx-handler-names */

        return (
            <View
                key = 'secondaryToolbar'
                style = { styles.secondaryToolbar }>
                {
                    AudioRouteButton
                        && <AudioRouteButton
                            iconName = { 'volume' }
                            iconStyle = { iconStyle }
                            style = { style }
                            underlayColor = { underlayColor } />
                }
                <ToolbarButton
                    disabled = { audioOnly || videoMuted }
                    iconName = 'switch-camera'
                    iconStyle = { iconStyle }
                    onClick = { this.props._onToggleCameraFacingMode }
                    style = { style }
                    underlayColor = { underlayColor } />
                <ToolbarButton
                    iconName = { audioOnly ? 'visibility-off' : 'visibility' }
                    iconStyle = { iconStyle }
                    onClick = { this.props._onToggleAudioOnly }
                    style = { style }
                    underlayColor = { underlayColor } />
                <ToolbarButton
                    iconName = {
                        this.props._locked ? 'security-locked' : 'security'
                    }
                    iconStyle = { iconStyle }
                    onClick = { this.props._onRoomLock }
                    style = { style }
                    underlayColor = { underlayColor } />
                {
                    _SHARE_ROOM_TOOLBAR_BUTTON
                        && <ToolbarButton
                            iconName = 'link'
                            iconStyle = { iconStyle }
                            onClick = { this.props._onShareRoom }
                            style = { style }
                            underlayColor = { underlayColor } />
                }
                <EnterPictureInPictureToolbarButton
                    iconStyle = { iconStyle }
                    style = { style }
                    underlayColor = { underlayColor } />
            </View>
        );

        /* eslint-enable react/jsx-curly-spacing,react/jsx-handler-names */
    }

    /**
     * Renders the primary and the secondary toolbars.
     *
     * @private
     * @returns {[ReactElement, ReactElement]}
     */
    _renderToolbars() {
        return [
            this._renderSecondaryToolbar(),
            this._renderPrimaryToolbar()
        ];
    }
}

/**
 * Additional properties for various icons, which are now platform-dependent.
 * This is done to have common logic of generating styles for web and native.
 * TODO As soon as we have common font sets for web and native, this will no
 * longer be required.
 */
// $FlowExpectedError
Object.assign(Toolbox.prototype, {
    audioIcon: 'microphone',
    audioMutedIcon: 'mic-disabled',
    videoIcon: 'camera',
    videoMutedIcon: 'camera-disabled'
});

/**
 * Maps redux actions to {@link Toolbox}'s React {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @private
 * @returns {{
 *     _onRoomLock: Function,
 *     _onToggleAudioOnly: Function,
 *     _onToggleCameraFacingMode: Function,
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        ...abstractMapDispatchToProps(dispatch),

        /**
         * Sets the lock i.e. password protection of the conference/room.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onRoomLock() {
            dispatch(beginRoomLockRequest());
        },

        /**
         * Begins the UI procedure to share the conference/room URL.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onShareRoom() {
            dispatch(beginShareRoom());
        },

        /**
         * Toggles the audio-only flag of the conference.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onToggleAudioOnly() {
            dispatch(toggleAudioOnly());
        },

        /**
         * Switches between the front/user-facing and back/environment-facing
         * cameras.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onToggleCameraFacingMode() {
            dispatch(toggleCameraFacingMode());
        }
    };
}

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _enabled: boolean,
 *     _locked: boolean
 * }}
 */
function _mapStateToProps(state) {
    const conference = state['features/base/conference'];
    const { enabled } = state['features/toolbox'];

    return {
        ...abstractMapStateToProps(state),

        /**
         * The indicator which determines whether the conference is in
         * audio-only mode.
         *
         * @protected
         * @type {boolean}
         */
        _audioOnly: Boolean(conference.audioOnly),

        /**
         * The indicator which determines whether the toolbox is enabled.
         *
         * @private
         * @type {boolean}
         */
        _enabled: enabled,

        /**
         * The indicator which determines whether the conference is
         * locked/password-protected.
         *
         * @protected
         * @type {boolean}
         */
        _locked: Boolean(conference.locked)
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(
    makeAspectRatioAware(Toolbox));
