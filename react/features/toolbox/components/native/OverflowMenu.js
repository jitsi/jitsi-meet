// @flow

import React, { Component } from 'react';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { AUDIO_ONLY_ENABLED, AUDIO_ROUTE_ENABLED, CHAT_ENABLED, CLOSED_CAPTION_ENABLED, INFO_DIALOG_ENABLED,
    INVITE_ENABLED, RECORDING_ENABLED, LIVE_STREAM_ENABLED, RAISE_HAND_ENABLED, ROOM_LOCK_ENABLED, TILE_VIEW_ENABLED,
    TOGGLE_CAMERA_ENABLED, getFeatureFlag } from '../../../base/flags';
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
    return {
        _audioOnlyEnabled: getFeatureFlag(state, AUDIO_ONLY_ENABLED, true),
        _audioRouteEnabled: getFeatureFlag(state, AUDIO_ROUTE_ENABLED, true),
        _bottomSheetStyles:
            ColorSchemeRegistry.get(state, 'BottomSheet'),
        _chatEnabled: getFeatureFlag(state, CHAT_ENABLED, true),
        _closedCaptionEnabled: getFeatureFlag(state, CLOSED_CAPTION_ENABLED, true),
        _infoDialogEnabled: getFeatureFlag(state, INFO_DIALOG_ENABLED, true),
        _inviteEnabled: getFeatureFlag(state, INVITE_ENABLED, true),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _liveStreamEnabled: getFeatureFlag(state, LIVE_STREAM_ENABLED, true),
        _raiseHandEnabled: getFeatureFlag(state, RAISE_HAND_ENABLED, true),
        _recordingEnabled: getFeatureFlag(state, RECORDING_ENABLED),
        _roomLockEnabled: getFeatureFlag(state, ROOM_LOCK_ENABLED, true),
        _tileViewEnabled: getFeatureFlag(state, TILE_VIEW_ENABLED, true),
        _toggleCameraEnabled: getFeatureFlag(state, TOGGLE_CAMERA_ENABLED, true)
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;
