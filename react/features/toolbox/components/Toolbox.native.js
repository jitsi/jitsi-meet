import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { toggleAudioOnly } from '../../base/conference';
import { MEDIA_TYPE, toggleCameraFacingMode } from '../../base/media';
import { Container } from '../../base/react';
import { ColorPalette } from '../../base/styles';
import { beginRoomLockRequest } from '../../room-lock';
import { beginShareRoom } from '../../share-room';

import {
    abstractMapDispatchToProps,
    abstractMapStateToProps
} from '../functions';
import { styles } from './styles';
import ToolbarButton from './ToolbarButton';

/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends Component {
    /**
     * Toolbox component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Flag showing that audio is muted.
         */
        _audioMuted: React.PropTypes.bool,

        /**
         * Flag showing whether room is locked.
         */
        _locked: React.PropTypes.bool,

        /**
         * Handler for hangup.
         */
        _onHangup: React.PropTypes.func,

        /**
         * Sets the lock i.e. password protection of the conference/room.
         */
        _onRoomLock: React.PropTypes.func,

        /**
         * Begins the UI procedure to share the conference/room URL.
         */
        _onShareRoom: React.PropTypes.func,

        /**
         * Handler for toggle audio.
         */
        _onToggleAudio: React.PropTypes.func,

        /**
         * Toggles the audio-only flag of the conference.
         */
        _onToggleAudioOnly: React.PropTypes.func,

        /**
         * Switches between the front/user-facing and back/environment-facing
         * cameras.
         */
        _onToggleCameraFacingMode: React.PropTypes.func,

        /**
         * Handler for toggling video.
         */
        _onToggleVideo: React.PropTypes.func,

        /**
         * Flag showing whether video is muted.
         */
        _videoMuted: React.PropTypes.bool,

        /**
         * Flag showing whether toolbar is visible.
         */
        _visible: React.PropTypes.bool
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container
                style = { styles.toolbarContainer }
                visible = { this.props._visible }>
                {
                    this._renderPrimaryToolbar()
                }
                {
                    this._renderSecondaryToolbar()
                }
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
            iconName = this[`${mediaType}MutedIcon`];
            iconStyle = styles.whitePrimaryToolbarButtonIcon;
            style = styles.whitePrimaryToolbarButton;
        } else {
            iconName = this[`${mediaType}Icon`];
            iconStyle = styles.primaryToolbarButtonIcon;
            style = styles.primaryToolbarButton;
        }

        return {
            iconName,
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
            <View style = { styles.primaryToolbar }>
                <ToolbarButton
                    iconName = { audioButtonStyles.iconName }
                    iconStyle = { audioButtonStyles.iconStyle }
                    onClick = { this.props._onToggleAudio }
                    style = { audioButtonStyles.style } />
                <ToolbarButton
                    iconName = 'hangup'
                    iconStyle = { styles.whitePrimaryToolbarButtonIcon }
                    onClick = { this.props._onHangup }
                    style = { styles.hangup }
                    underlayColor = { ColorPalette.buttonUnderlay } />
                <ToolbarButton
                    iconName = { videoButtonStyles.iconName }
                    iconStyle = { videoButtonStyles.iconStyle }
                    onClick = { this.props._onToggleVideo }
                    style = { videoButtonStyles.style } />
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

        /* eslint-disable react/jsx-curly-spacing,react/jsx-handler-names */

        return (
            <View style = { styles.secondaryToolbar }>
                <ToolbarButton
                    iconName = 'switch-camera'
                    iconStyle = { iconStyle }
                    onClick = { this.props._onToggleCameraFacingMode }
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
                <ToolbarButton
                    iconName = 'hangup'
                    iconStyle = { styles.toggleAudioOnlyIcon }
                    onClick = { this.props._onToggleAudioOnly }
                    style = { style }
                    underlayColor = { underlayColor } />
                <ToolbarButton
                    iconName = 'link'
                    iconStyle = { iconStyle }
                    onClick = { this.props._onShareRoom }
                    style = { style }
                    underlayColor = { underlayColor } />
            </View>
        );

        /* eslint-enable react/jsx-curly-spacing,react/jsx-handler-names */
    }
}

/**
 * Additional properties for various icons, which are now platform-dependent.
 * This is done to have common logic of generating styles for web and native.
 * TODO As soon as we have common font sets for web and native, this will no
 * longer be required.
 */
Object.assign(Toolbox.prototype, {
    audioIcon: 'microphone',
    audioMutedIcon: 'mic-disabled',
    videoIcon: 'camera',
    videoMutedIcon: 'camera-disabled'
});

/**
 * Maps actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *     _onRoomLock: Function,
 *     _onToggleAudioOnly: Function,
 *     _onToggleCameraFacingMode: Function,
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch) {
    return {
        ...abstractMapDispatchToProps(dispatch),

        /**
         * Sets the lock i.e. password protection of the conference/room.
         *
         * @private
         * @returns {Object} Dispatched action.
         * @type {Function}
         */
        _onRoomLock() {
            return dispatch(beginRoomLockRequest());
        },

        /**
         * Begins the UI procedure to share the conference/room URL.
         *
         * @private
         * @returns {void} Dispatched action.
         * @type {Function}
         */
        _onShareRoom() {
            return dispatch(beginShareRoom());
        },

        /**
         * Toggles the audio-only flag of the conference.
         *
         * @private
         * @returns {Object} Dispatched action.
         * @type {Function}
         */
        _onToggleAudioOnly() {
            return dispatch(toggleAudioOnly());
        },

        /**
         * Switches between the front/user-facing and back/environment-facing
         * cameras.
         *
         * @private
         * @returns {Object} Dispatched action.
         * @type {Function}
         */
        _onToggleCameraFacingMode() {
            return dispatch(toggleCameraFacingMode());
        }
    };
}

/**
 * Maps part of Redux store to React component props.
 *
 * @param {Object} state - Redux store.
 * @returns {{
 *     _locked: boolean
 * }}
 * @private
 */
function _mapStateToProps(state) {
    const conference = state['features/base/conference'];

    return {
        ...abstractMapStateToProps(state),

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

export default connect(_mapStateToProps, _mapDispatchToProps)(Toolbox);
