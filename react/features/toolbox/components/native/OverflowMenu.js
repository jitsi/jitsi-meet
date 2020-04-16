// @flow

import React, { PureComponent } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import Collapsible from 'react-native-collapsible';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { DEFAULT_TOOLBAR_BUTTONS, IOS_RECORDING_ENABLED, TOOLBAR_BUTTONS,
    getFeatureFlag } from '../../../base/flags';
import { IconDragHandle } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { SharedDocumentButton } from '../../../etherpad';
import { InviteButton } from '../../../invite';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { LiveStreamButton, RecordButton } from '../../../recording';
import { RoomLockButton } from '../../../room-lock';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';

import HelpButton from '../HelpButton';

import AudioOnlyButton from './AudioOnlyButton';
import MoreOptionsButton from './MoreOptionsButton';
import RaiseHandButton from './RaiseHandButton';
import ToggleCameraButton from './ToggleCameraButton';
import styles from './styles';

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
     * Whether the closed caption feature has been enabled.
     */
    _closedCaptionEnabled: boolean,

    /**
     * Whether the help button has been enabled.
     */
    _helpButton: boolean,

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
     * Whether the sharedDocument button has been enabled.
     */
    _sharedDocumentButton: boolean,

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

type State = {

    /**
     * True if the bottom scheet is scrolled to the top.
     */
    scrolledToTop: boolean,

    /**
     * True if the 'more' button set needas to be rendered.
     */
    showMore: boolean
}

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
class OverflowMenu extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            scrolledToTop: true,
            showMore: false
        };

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSwipe = this._onSwipe.bind(this);
        this._onToggleMenu = this._onToggleMenu.bind(this);
        this._renderMenuExpandToggle = this._renderMenuExpandToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _bottomSheetStyles } = this.props;
        const { showMore } = this.state;

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        const moreOptionsButtonProps = {
            ...buttonProps,
            afterClick: this._onToggleMenu,
            visible: !showMore
        };
        const isMoreButtonsAvailable = this.props._toggleCameraEnabled || this.props._tileViewEnabled
        || this.props._recordingEnabled || this.props._liveStreamEnabled || this.props._roomLockEnabled
        || this.props._closedCaptionEnabled || this.props._sharedDocumentButton || this.props._helpButton;

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                onSwipe = { this._onSwipe }
                renderHeader = { isMoreButtonsAvailable && this._renderMenuExpandToggle }>
                {
                    this.props._audioRouteEnabled
                        && <AudioRouteButton { ...buttonProps } />
                }
                {
                    this.props._inviteEnabled
                        && <InviteButton { ...buttonProps } />
                }
                {
                    this.props._audioOnlyEnabled
                        && <AudioOnlyButton { ...buttonProps } />
                }
                {
                    this.props._raiseHandEnabled
                        && <RaiseHandButton { ...buttonProps } />
                }
                {
                    isMoreButtonsAvailable && <MoreOptionsButton { ...moreOptionsButtonProps } />
                }
                <Collapsible collapsed = { !showMore }>
                    {
                        this.props._toggleCameraEnabled
                        && <ToggleCameraButton { ...buttonProps } />
                    }
                    {
                        this.props._tileViewEnabled
                            && <TileViewButton { ...buttonProps } />
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
                        this.props._roomLockEnabled
                            && <RoomLockButton { ...buttonProps } />
                    }
                    {
                        this.props._closedCaptionEnabled
                            && <ClosedCaptionButton { ...buttonProps } />
                    }
                    {
                        this.props._sharedDocumentButton
                            && <SharedDocumentButton { ...buttonProps } />
                    }
                    {
                        this.props._helpButton
                            && <HelpButton { ...buttonProps } />
                    }
                </Collapsible>
            </BottomSheet>
        );
    }

    _renderMenuExpandToggle: () => React$Element<any>;

    /**
     * Function to render the menu toggle in the bottom sheet header area.
     *
     * @returns {React$Element}
     */
    _renderMenuExpandToggle() {
        return (
            <View
                style = { [
                    this.props._bottomSheetStyles.sheet,
                    styles.expandMenuContainer
                ] }>
                <TouchableOpacity onPress = { this._onToggleMenu }>
                    { /* $FlowFixMeProps */ }
                    <IconDragHandle style = { this.props._bottomSheetStyles.expandIcon } />
                </TouchableOpacity>
            </View>
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

    _onSwipe: string => void;

    /**
     * Callback to be invoked when swipe gesture is detected on the menu. Returns true
     * if the swipe gesture is handled by the menu, false otherwise.
     *
     * @param {string} direction - Direction of 'up' or 'down'.
     * @returns {boolean}
     */
    _onSwipe(direction) {
        const { showMore } = this.state;

        switch (direction) {
        case 'up':
            !showMore && this.setState({
                showMore: true
            });

            return !showMore;
        case 'down':
            showMore && this.setState({
                showMore: false
            });

            return showMore;
        }
    }

    _onToggleMenu: () => void;

    /**
     * Callback to be invoked when the expand menu button is pressed.
     *
     * @returns {void}
     */
    _onToggleMenu() {
        this.setState({
            showMore: !this.state.showMore
        });
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
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _closedCaptionEnabled: overflowButtons.includes('closedcaption'),
        _helpButton: overflowButtons.includes('help'),
        _inviteEnabled: overflowButtons.includes('invite'),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _liveStreamEnabled: overflowButtons.includes('livestream'),
        _raiseHandEnabled: overflowButtons.includes('raisehand'),
        _recordingEnabled: recordingEnabled,
        _roomLockEnabled: overflowButtons.includes('roomlock'),
        _sharedDocumentButton: overflowButtons.includes('shareddocument'),
        _tileViewEnabled: overflowButtons.includes('tileview'),
        _toggleCameraEnabled: overflowButtons.includes('togglecamera')
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;
