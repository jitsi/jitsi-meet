// @flow

import React, { PureComponent } from 'react';
import { Divider } from 'react-native-paper';

import { BottomSheet, hideSheet } from '../../../base/dialog';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { connect } from '../../../base/redux';
import SettingsButton from '../../../base/settings/components/native/SettingsButton';
import { SharedDocumentButton } from '../../../etherpad';
import { ReactionMenu } from '../../../reactions/components';
import { isReactionsEnabled } from '../../../reactions/functions.any';
import { LiveStreamButton, RecordButton } from '../../../recording';
import SecurityDialogButton
    from '../../../security/components/security-dialog/native/SecurityDialogButton';
import { SharedVideoButton } from '../../../shared-video/components';
import SpeakerStatsButton from '../../../speaker-stats/components/native/SpeakerStatsButton';
import { isSpeakerStatsDisabled } from '../../../speaker-stats/functions';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';
import styles from '../../../video-menu/components/native/styles';
import { getMovableButtons } from '../../functions.native';

import AudioOnlyButton from './AudioOnlyButton';
import LinkToSalesforceButton from './LinkToSalesforceButton';
import OpenCarmodeButton from './OpenCarmodeButton';
import RaiseHandButton from './RaiseHandButton';
import ScreenSharingButton from './ScreenSharingButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the recoding button should be enabled or not.
     */
    _recordingEnabled: boolean,

    /**
     * The width of the screen.
     */
    _width: number,

    /**
     * Whether or not the reactions feature is enabled.
     */
    _reactionsEnabled: boolean,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function,

    /**
     * Whether or not speaker stats is disable.
     */
    _isSpeakerStatsDisabled: boolean
};

type State = {

    /**
     * True if the bottom scheet is scrolled to the top.
     */
    scrolledToTop: boolean
}

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
            _isSpeakerStatsDisabled,
            _reactionsEnabled,
            _width
        } = this.props;
        const toolbarButtons = getMovableButtons(_width);

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: bottomSheetStyles.buttons
        };

        const topButtonProps = {
            afterClick: this._onCancel,
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
                renderFooter = { _reactionsEnabled && !toolbarButtons.has('raisehand')
                    ? this._renderReactionMenu
                    : null }>
                <OpenCarmodeButton { ...topButtonProps } />
                <AudioOnlyButton { ...buttonProps } />
                {!_reactionsEnabled && !toolbarButtons.has('raisehand') && <RaiseHandButton { ...buttonProps } />}
                <Divider style = { styles.divider } />
                <SecurityDialogButton { ...buttonProps } />
                <RecordButton { ...buttonProps } />
                <LiveStreamButton { ...buttonProps } />
                <LinkToSalesforceButton { ...buttonProps } />
                <Divider style = { styles.divider } />
                <SharedVideoButton { ...buttonProps } />
                {!toolbarButtons.has('screensharing') && <ScreenSharingButton { ...buttonProps } />}
                {!_isSpeakerStatsDisabled && <SpeakerStatsButton { ...buttonProps } />}
                {!toolbarButtons.has('tileview') && <TileViewButton { ...buttonProps } />}
                <Divider style = { styles.divider } />
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
     * Functoin to render the reaction menu as the footer of the bottom sheet.
     *
     * @returns {React$Element}
     */
    _renderReactionMenu() {
        return (<ReactionMenu
            onCancel = { this._onCancel }
            overflowMenu = { true } />);
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
        _isSpeakerStatsDisabled: isSpeakerStatsDisabled(state),
        _reactionsEnabled: isReactionsEnabled(state),
        _width: state['features/base/responsive-ui'].clientWidth
    };
}

export default connect(_mapStateToProps)(OverflowMenu);
