// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { CHAT_ENABLED, DEFAULT_TOOLBAR_BUTTONS, IOS_RECORDING_ENABLED, TOOLBAR_BUTTONS,
    getFeatureFlag } from '../../../base/flags';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { InfoDialogButton, InviteButton } from '../../../invite';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { LiveStreamButton, RecordButton } from '../../../recording';
import { RoomLockButton } from '../../../room-lock';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';

import AudioOnlyButton from './AudioOnlyButton';
import RaiseHandButton from './RaiseHandButton';
import ToggleCameraButton from './ToggleCameraButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * Whether the audio only feature has been enabled.
     */
    _audioOnlyEnabled: boolean,

    /**
     * Whether the audio route feature has been enabled.
     */
    _audioRouteEnabled: boolean,

    /**
     * The color-schemed stylesheet of the dialog feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * Whether the chat feature has been enabled. The meeting info button will be displayed in its place when disabled.
     */
    _chatEnabled: boolean,

    /**
     * Whether the closed caption feature has been enabled.
     */
    _closedCaptionEnabled: boolean,

    /**
     * Whether the info dialog feature has been enabled.
     */
    _infoDialogEnabled: boolean,

    /**
     * Whether the invite feature has been enabled.
     */
    _inviteEnabled: boolean,

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the live stream feature has been enabled.
     */
    _liveStreamEnabled: boolean,

    /**
     * Whether the raise hand feature has been enabled.
     */
    _raiseHandEnabled: boolean,

    /**
     * Whether the recoding button should be enabled or not.
     */
    _recordingEnabled: boolean,

    /**
     * Whether the roomlock button has been enabled.
     */
    _roomLockEnabled: boolean,

    /**
     * Whether the tile view feature has been enabled.
     */
    _tileViewEnabled: boolean,

    /**
     * Whether the toggle camera button has been enabled.
     */
    _toggleCameraEnabled: boolean,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let OverflowMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class OverflowMenu extends Component<Props> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: this.props._bottomSheetStyles
        };

        return (
            <BottomSheet onCancel = { this._onCancel }>
                {
                    this.props._audioRouteEnabled
                        && <AudioRouteButton { ...buttonProps } />
                }
                {
                    this.props._toggleCameraEnabled
                        && <ToggleCameraButton { ...buttonProps } />
                }
                {
                    this.props._audioOnlyEnabled
                        && <AudioOnlyButton { ...buttonProps } />
                }
                {
                    this.props._roomLockEnabled
                        && <RoomLockButton { ...buttonProps } />
                }
                {
                    this.props._closedCaptionEnabled
                        && <ClosedCaptionButton { ...buttonProps } />
                }
                {
                    this.props._recordingEnabled
                        && <RecordButton { ...buttonProps } />
                }
                {
                    this.props._liveStreamEnabled
                        && <LiveStreamButton { ...buttonProps } />
                }
                {
                    this.props._tileViewEnabled
                        && <TileViewButton { ...buttonProps } />
                }
                {
                    this.props._inviteEnabled
                        && <InviteButton { ...buttonProps } />
                }
                {
                    this.props._chatEnabled && this.props._infoDialogEnabled
                        && <InfoDialogButton { ...buttonProps } />
                }
                {
                    this.props._raiseHandEnabled
                        && <RaiseHandButton { ...buttonProps } />
                }
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Hides this {@code OverflowMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(OverflowMenu_));

            return true;
        }

        return false;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const overflowButtons = getFeatureFlag(state, TOOLBAR_BUTTONS, DEFAULT_TOOLBAR_BUTTONS);
    const recordingEnabled = Platform.OS === 'ios' ? getFeatureFlag(state, IOS_RECORDING_ENABLED)
        && overflowButtons.includes('recording') : overflowButtons.includes('recording');

    return {
        _audioOnlyEnabled: overflowButtons.includes('audioonly'),
        _audioRouteEnabled: overflowButtons.includes('audioroute'),
        _bottomSheetStyles:
            ColorSchemeRegistry.get(state, 'BottomSheet'),
        _chatEnabled: getFeatureFlag(state, CHAT_ENABLED, true),
        _closedCaptionEnabled: overflowButtons.includes('closedcaption'),
        _infoDialogEnabled: overflowButtons.includes('infodialog'),
        _inviteEnabled: overflowButtons.includes('invite'),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _liveStreamEnabled: overflowButtons.includes('livestream'),
        _raiseHandEnabled: overflowButtons.includes('raisehand'),
        _recordingEnabled: recordingEnabled,
        _roomLockEnabled: overflowButtons.includes('roomlock'),
        _tileViewEnabled: overflowButtons.includes('tileview'),
        _toggleCameraEnabled: overflowButtons.includes('togglecamera')
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;
