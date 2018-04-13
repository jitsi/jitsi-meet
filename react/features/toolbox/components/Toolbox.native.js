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
import { ColorPalette } from '../../base/styles';
import { InviteButton } from '../../invite';
import {
    EnterPictureInPictureToolbarButton
} from '../../mobile/picture-in-picture';
import { beginRoomLockRequest } from '../../room-lock';

import {
    abstractMapDispatchToProps,
    abstractMapStateToProps
} from '../functions';

import AudioRouteButton from './AudioRouteButton';
import styles from './styles';
import ToolbarButton from './ToolbarButton';

import { AudioMuteButton, HangupButton, VideoMuteButton } from './buttons';

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
     *     iconStyle: Object,
     *     style: Object
     * }}
     */
    _getMuteButtonStyles(mediaType) {
        let iconStyle;
        let style;

        if (this.props[`_${mediaType}Muted`]) {
            iconStyle = styles.whitePrimaryToolbarButtonIcon;
            style = styles.whitePrimaryToolbarButton;
        } else {
            iconStyle = styles.primaryToolbarButtonIcon;
            style = styles.primaryToolbarButton;
        }

        return {
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
        const hangupButtonStyles = {
            iconStyle: styles.whitePrimaryToolbarButtonIcon,
            style: styles.hangup,
            underlayColor: ColorPalette.buttonUnderlay
        };

        /* eslint-disable react/jsx-handler-names */

        return (
            <View
                key = 'primaryToolbar'
                pointerEvents = 'box-none'
                style = { styles.primaryToolbar }>
                <AudioMuteButton styles = { audioButtonStyles } />
                <HangupButton styles = { hangupButtonStyles } />
                <VideoMuteButton styles = { videoButtonStyles } />
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
                pointerEvents = 'box-none'
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
                <InviteButton
                    iconStyle = { iconStyle }
                    style = { style }
                    underlayColor = { underlayColor } />
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
