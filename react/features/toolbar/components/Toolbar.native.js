import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { MEDIA_TYPE, toggleCameraFacingMode } from '../../base/media';
import { Container } from '../../base/react';
import { ColorPalette } from '../../base/styles';
import { beginRoomLockRequest } from '../../room-lock';

import {
    abstractMapDispatchToProps,
    abstractMapStateToProps
} from '../functions';
import { styles } from './styles';
import ToolbarButton from './ToolbarButton';

/**
 * Implements the conference toolbar on React Native.
 */
class Toolbar extends Component {
    /**
     * Toolbar component's property types.
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
         * Handler for room locking.
         */
        _onRoomLock: React.PropTypes.func,

        /**
         * Handler for toggle audio.
         */
        _onToggleAudio: React.PropTypes.func,

        /**
         * Handler for toggling camera facing mode.
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
        let style = styles.primaryToolbarButton;

        if (this.props[`_${mediaType}Muted`]) {
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
                    iconStyle = { styles.whiteIcon }
                    onClick = { this.props._onHangup }
                    style = {{
                        ...styles.primaryToolbarButton,
                        backgroundColor: ColorPalette.red
                    }}
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
        const iconStyle = styles.secondaryToolbarIcon;
        const style = styles.secondaryToolbarButton;
        const underlayColor = 'transparent';

        /* eslint-disable react/jsx-curly-spacing,react/jsx-handler-names */

        return (
            <View style = { styles.secondaryToolbar }>
                {/* FIXME There are multiple issues with the toggling of the
                  * camera facing more. For example, switching from the user
                  * facing camera to the environment facing camera on iOS may be
                  * very slow or may not work at all. On Android the toggling
                  * either works or does not. The causes of the various problems
                  * have been identified to lie within either
                  * react-native-webrtc or Google's native WebRTC API.
                  *
                <ToolbarButton
                    iconName = 'switch-camera'
                    iconStyle = { iconStyle }
                    onClick = { this.props._onToggleCameraFacingMode }
                    style = { style }
                    underlayColor = { underlayColor } />
                  */}
                <ToolbarButton
                    iconName = {
                        this.props._locked ? 'security-locked' : 'security'
                    }
                    iconStyle = { iconStyle }
                    onClick = { this.props._onRoomLock }
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
Object.assign(Toolbar.prototype, {
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
 *     _onToggleCameraFacingMode: Function,
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch) {
    return {
        ...abstractMapDispatchToProps(dispatch),

        /**
         * Dispatches an action to set the lock i.e. password protection of the
         * conference/room.
         *
         * @private
         * @returns {Object} - Dispatched action.
         * @type {Function}
         */
        _onRoomLock() {
            return dispatch(beginRoomLockRequest());
        },

        /**
         * Switches between the front/user-facing and rear/environment-facing
         * cameras.
         *
         * @private
         * @returns {Object} - Dispatched action.
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
        _locked: conference.locked
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(Toolbar);
