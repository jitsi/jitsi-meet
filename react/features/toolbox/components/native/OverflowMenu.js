// @flow

import React, { PureComponent } from 'react';
import { Divider } from 'react-native-paper';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { SharedDocumentButton } from '../../../etherpad';
import { ParticipantsPaneButton } from '../../../participants-pane/components/native';
import { ReactionMenu } from '../../../reactions/components';
import { isReactionsEnabled } from '../../../reactions/functions.any';
import { LiveStreamButton, RecordButton } from '../../../recording';
import SecurityDialogButton
    from '../../../security/components/security-dialog/native/SecurityDialogButton';
import { SharedVideoButton } from '../../../shared-video/components';
import SpeakerStatsButton from '../../../speaker-stats/components/native/SpeakerStatsButton';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';
import styles from '../../../video-menu/components/native/styles';
import { getMovableButtons } from '../../functions.native';
import HelpButton from '../HelpButton';

import AudioOnlyButton from './AudioOnlyButton';
import LinkToSalesforceButton from './LinkToSalesforceButton';
import RaiseHandButton from './RaiseHandButton';
import ScreenSharingButton from './ScreenSharingButton.js';
import ToggleCameraButton from './ToggleCameraButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the dialog feature.
     */
    _bottomSheetStyles: StyleType,

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
    dispatch: Function
};

type State = {

    /**
     * True if the bottom scheet is scrolled to the top.
     */
    scrolledToTop: boolean
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
            _bottomSheetStyles,
            _width,
            _reactionsEnabled
        } = this.props;
        const toolbarButtons = getMovableButtons(_width);

        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        const topButtonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: {
                ..._bottomSheetStyles.buttons,
                style: {
                    ..._bottomSheetStyles.buttons.style,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                }
            }
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderFooter = { _reactionsEnabled && !toolbarButtons.has('raisehand')
                    ? this._renderReactionMenu
                    : null }>
                <ParticipantsPaneButton { ...topButtonProps } />
                <AudioOnlyButton { ...buttonProps } />
                {!_reactionsEnabled && !toolbarButtons.has('raisehand') && <RaiseHandButton { ...buttonProps } />}
                <Divider style = { styles.divider } />
                <SecurityDialogButton { ...buttonProps } />
                <RecordButton { ...buttonProps } />
                <LiveStreamButton { ...buttonProps } />
                <LinkToSalesforceButton { ...buttonProps } />
                <Divider style = { styles.divider } />
                <SharedVideoButton { ...buttonProps } />
                <ScreenSharingButton { ...buttonProps } />
                <SpeakerStatsButton { ...buttonProps } />
                {!toolbarButtons.has('togglecamera') && <ToggleCameraButton { ...buttonProps } />}
                {!toolbarButtons.has('tileview') && <TileViewButton { ...buttonProps } />}
                <Divider style = { styles.divider } />
                <ClosedCaptionButton { ...buttonProps } />
                <SharedDocumentButton { ...buttonProps } />
                <HelpButton { ...buttonProps } />
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

    _renderReactionMenu: () => React$Element<any>;

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
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _width: state['features/base/responsive-ui'].clientWidth,
        _reactionsEnabled: isReactionsEnabled(state)
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;
