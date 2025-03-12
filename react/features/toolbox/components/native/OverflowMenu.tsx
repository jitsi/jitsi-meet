import React, { PureComponent } from 'react';
import { ViewStyle } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect, useSelector } from 'react-redux';

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
import styles from '../../../video-menu/components/native/styles';
import WhiteboardButton from '../../../whiteboard/components/native/WhiteboardButton';
import { customButtonPressed } from '../../actions.native';
import { getVisibleNativeButtons } from '../../functions.native';
import { useNativeToolboxButtons } from '../../hooks.native';
import { IToolboxNativeButton } from '../../types';

import AudioOnlyButton from './AudioOnlyButton';
import LinkToSalesforceButton from './LinkToSalesforceButton';
import OpenCarmodeButton from './OpenCarmodeButton';
import RaiseHandButton from './RaiseHandButton';


/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
interface IProps {

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
     * Toolbar buttons.
     */
    _mainMenuButtons?: Array<IToolboxNativeButton>;

    /**
     * Overflow menu buttons.
     */
    _overflowMenuButtons?: Array<IToolboxNativeButton>;

    /**
     * Whether the recoding button should be enabled or not.
    */
    _recordingEnabled: boolean;

    /**
    * Whether or not any reactions buttons should be displayed.
    */
    _shouldDisplayReactionsButtons: boolean;

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
    override render() {
        const {
            _isBreakoutRoomsSupported,
            _isSpeakerStatsDisabled,
            _isSharedVideoEnabled,
            dispatch
        } = this.props;

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
                renderFooter = { this._renderReactionMenu }>
                <Divider style = { styles.divider as ViewStyle } />
                <OpenCarmodeButton { ...topButtonProps } />
                <AudioOnlyButton { ...buttonProps } />
                { this._renderRaiseHandButton(buttonProps) }
                {/* @ts-ignore */}
                <SecurityDialogButton { ...buttonProps } />
                <RecordButton { ...buttonProps } />
                <LiveStreamButton { ...buttonProps } />
                <LinkToSalesforceButton { ...buttonProps } />
                <WhiteboardButton { ...buttonProps } />
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                {_isSharedVideoEnabled && <SharedVideoButton { ...buttonProps } />}
                { this._renderOverflowMenuButtons(topButtonProps) }
                {!_isSpeakerStatsDisabled && <SpeakerStatsButton { ...buttonProps } />}
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
        const { _mainMenuButtons, _shouldDisplayReactionsButtons } = this.props;

        // @ts-ignore
        const isRaiseHandInMainMenu = _mainMenuButtons?.some(item => item.key === 'raisehand');

        if (_shouldDisplayReactionsButtons && !isRaiseHandInMainMenu) {
            return (
                <ReactionMenu
                    onCancel = { this._onCancel }
                    overflowMenu = { true } />
            );
        }
    }

    /**
     * Function to render the reaction menu as the footer of the bottom sheet.
     *
     * @param {Object} buttonProps - Styling button properties.
     * @returns {React.ReactElement}
     */
    _renderRaiseHandButton(buttonProps: Object) {
        const { _mainMenuButtons, _shouldDisplayReactionsButtons } = this.props;

        // @ts-ignore
        const isRaiseHandInMainMenu = _mainMenuButtons?.some(item => item.key === 'raisehand');

        if (!_shouldDisplayReactionsButtons && !isRaiseHandInMainMenu) {
            return (
                <RaiseHandButton { ...buttonProps } />
            );
        }
    }

    /**
     * Function to render the custom buttons for the overflow menu.
     *
     * @param {Object} topButtonProps - Styling button properties.
     * @returns {React.ReactElement}
     */
    _renderOverflowMenuButtons(topButtonProps: Object) {
        const { _overflowMenuButtons, dispatch } = this.props;

        if (!_overflowMenuButtons?.length) {
            return;
        }

        return (
            <>
                {
                    _overflowMenuButtons?.map(({ Content, key, text, ...rest }: IToolboxNativeButton) => {

                        if (key === 'raisehand') {
                            return null;
                        }

                        return (
                            <Content
                                { ...topButtonProps }
                                { ...rest }
                                /* eslint-disable react/jsx-no-bind */
                                handleClick = { () => dispatch(customButtonPressed(key, text)) }
                                isToolboxButton = { false }
                                key = { key }
                                text = { text } />
                        );
                    })
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

    return {
        _isBreakoutRoomsSupported: conference?.getBreakoutRooms()?.isSupported(),
        _isSharedVideoEnabled: isSharedVideoEnabled(state),
        _isSpeakerStatsDisabled: isSpeakerStatsDisabled(state),
        _shouldDisplayReactionsButtons: shouldDisplayReactionsButtons(state)
    };
}

export default connect(_mapStateToProps)(props => {
    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const { customToolbarButtons } = useSelector((state: IReduxState) => state['features/base/config']);
    const {
        mainToolbarButtonsThresholds,
        toolbarButtons
    } = useSelector((state: IReduxState) => state['features/toolbox']);

    const allButtons = useNativeToolboxButtons(customToolbarButtons);

    const { mainMenuButtons, overflowMenuButtons } = getVisibleNativeButtons({
        allButtons,
        clientWidth,
        mainToolbarButtonsThresholds,
        toolbarButtons
    });

    return (
        <OverflowMenu

            // @ts-ignore
            { ... props }
            _mainMenuButtons = { mainMenuButtons }
            _overflowMenuButtons = { overflowMenuButtons } />
    );
});
