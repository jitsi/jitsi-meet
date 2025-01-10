import React, { PureComponent } from 'react';
import { ViewStyle } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import SettingsButton from '../../../base/settings/components/native/SettingsButton';
import BreakoutRoomsButton
    from '../../../breakout-rooms/components/native/BreakoutRoomsButton';
import SharedDocumentButton from '../../../etherpad/components/SharedDocumentButton.native';
import ReactionMenu from '../../../reactions/components/native/ReactionMenu';
import { shouldDisplayReactionsButtons } from '../../../reactions/functions.any';
import LiveStreamButton from '../../../recording/components/LiveStream/native/LiveStreamButton';
import RecordButton from '../../../recording/components/Recording/native/RecordButton';
import SecurityDialogButton
    from '../../../security/components/security-dialog/native/SecurityDialogButton';
import SharedVideoButton from '../../../shared-video/components/native/SharedVideoButton';
import { isSharedVideoEnabled } from '../../../shared-video/functions';
import SpeakerStatsButton from '../../../speaker-stats/components/native/SpeakerStatsButton';
import { isSpeakerStatsDisabled } from '../../../speaker-stats/functions';
import ClosedCaptionButton from '../../../subtitles/components/native/ClosedCaptionButton';
import TileViewButton from '../../../video-layout/components/TileViewButton';
import styles from '../../../video-menu/components/native/styles';
import WhiteboardButton from '../../../whiteboard/components/native/WhiteboardButton';
import { customOverflowMenuButtonPressed } from '../../actions.native';
import { getMovableButtons } from '../../functions.native';

import AudioOnlyButton from './AudioOnlyButton';
import CustomOptionButton from './CustomOptionButton';
import LinkToSalesforceButton from './LinkToSalesforceButton';
import OpenCarmodeButton from './OpenCarmodeButton';
import RaiseHandButton from './RaiseHandButton';
import ScreenSharingButton from './ScreenSharingButton';


/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
interface IProps {

    /**
     * Custom Toolbar buttons.
     */
    _customToolbarButtons?: Array<{ backgroundColor?: string; icon: string; id: string; text: string; }>;

    /**
     * True if breakout rooms feature is available, false otherwise.
     */
    _isBreakoutRoomsSupported?: boolean;

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean;

    /**
     * Whether the shared video is enabled or not.
     */
    _isSharedVideoEnabled: boolean;

    /**
     * Whether or not speaker stats is disable.
     */
    _isSpeakerStatsDisabled?: boolean;

    /**
     * Whether the recoding button should be enabled or not.
    */
    _recordingEnabled: boolean;

    /**
    * Whether or not any reactions buttons should be displayed.
    */
    _shouldDisplayReactionsButtons: boolean;

    /**
     * The width of the screen.
     */
    _width: number;

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: IStore['dispatch'];
}

interface IState {

    /**
     * True if the bottom sheet is scrolled to the top.
     */
    scrolledToTop: boolean;
}

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class OverflowMenu extends PureComponent<IProps, IState> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            scrolledToTop: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._renderReactionMenu = this._renderReactionMenu.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isBreakoutRoomsSupported,
            _isSpeakerStatsDisabled,
            _isSharedVideoEnabled,
            _shouldDisplayReactionsButtons,
            _width,
            dispatch
        } = this.props;
        const toolbarButtons = getMovableButtons(_width);

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: bottomSheetStyles.buttons
        };

        const topButtonProps = {
            afterClick: this._onCancel,
            dispatch,
            showLabel: true,
            styles: {
                ...bottomSheetStyles.buttons,
                style: {
                    ...bottomSheetStyles.buttons.style,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                }
            }
        };

        return (
            <BottomSheet
                renderFooter = { _shouldDisplayReactionsButtons && !toolbarButtons.has('raisehand')
                    ? this._renderReactionMenu
                    : undefined }>
                { this._renderCustomOverflowMenuButtons(topButtonProps) }
                <OpenCarmodeButton { ...topButtonProps } />
                <AudioOnlyButton { ...buttonProps } />
                {
                    !_shouldDisplayReactionsButtons && !toolbarButtons.has('raisehand')
                        && <RaiseHandButton { ...buttonProps } />
                }
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                <SecurityDialogButton { ...buttonProps } />
                <RecordButton { ...buttonProps } />
                <LiveStreamButton { ...buttonProps } />
                <LinkToSalesforceButton { ...buttonProps } />
                <WhiteboardButton { ...buttonProps } />
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                {_isSharedVideoEnabled && <SharedVideoButton { ...buttonProps } />}
                {!toolbarButtons.has('screensharing') && <ScreenSharingButton { ...buttonProps } />}
                {!_isSpeakerStatsDisabled && <SpeakerStatsButton { ...buttonProps } />}
                {!toolbarButtons.has('tileview') && <TileViewButton { ...buttonProps } />}
                {_isBreakoutRoomsSupported && <BreakoutRoomsButton { ...buttonProps } />}
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                <ClosedCaptionButton { ...buttonProps } />
                <SharedDocumentButton { ...buttonProps } />
                <SettingsButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    /**
     * Hides this {@code OverflowMenu}.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the reaction menu as the footer of the bottom sheet.
     *
     * @returns {React.ReactElement}
     */
    _renderReactionMenu() {
        return (
            <ReactionMenu
                onCancel = { this._onCancel }
                overflowMenu = { true } />
        );
    }

    /**
     * Function to render the custom buttons for the overflow menu.
     *
     * @param {Object} topButtonProps - Button properties.
     * @returns {React.ReactElement}
     */
    _renderCustomOverflowMenuButtons(topButtonProps: Object) {
        const { _customToolbarButtons, dispatch } = this.props;

        if (!_customToolbarButtons?.length) {
            return;
        }

        return (
            <>
                {
                    _customToolbarButtons.map(({ id, text, icon, backgroundColor }) => (
                        <CustomOptionButton
                            { ...topButtonProps }
                            backgroundColor = { backgroundColor }
                            /* eslint-disable react/jsx-no-bind */
                            handleClick = { () =>
                                dispatch(customOverflowMenuButtonPressed(id, text))
                            }
                            icon = { icon }
                            key = { id }
                            text = { text } />
                    ))
                }
                <Divider style = { styles.divider as ViewStyle } />
            </>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { conference } = state['features/base/conference'];
    const { customToolbarButtons } = state['features/base/config'];

    return {
        _customToolbarButtons: customToolbarButtons,
        _isBreakoutRoomsSupported: conference?.getBreakoutRooms()?.isSupported(),
        _isSharedVideoEnabled: isSharedVideoEnabled(state),
        _isSpeakerStatsDisabled: isSpeakerStatsDisabled(state),
        _shouldDisplayReactionsButtons: shouldDisplayReactionsButtons(state),
        _width: state['features/base/responsive-ui'].clientWidth
    };
}

export default connect(_mapStateToProps)(OverflowMenu);
