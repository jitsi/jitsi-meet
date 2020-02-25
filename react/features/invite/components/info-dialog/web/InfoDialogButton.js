// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { IconInfo } from '../../../../base/icons';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { getParticipantCount } from '../../../../base/participants';
import { OverflowMenuItem } from '../../../../base/toolbox';
import { connect } from '../../../../base/redux';
import { getActiveSession } from '../../../../recording';
import { ToolbarButton } from '../../../../toolbox';
import { updateDialInNumbers } from '../../../actions';

import InfoDialog from './InfoDialog';

/**
 * The type of the React {@code Component} props of {@link InfoDialogButton}.
 */
type Props = {

    /**
     * The redux state representing the dial-in numbers feature.
     */
    _dialIn: Object,

    /**
     * Whether or not the {@code InfoDialog} should display automatically when
     * in a lonely call.
     */
    _disableAutoShow: boolean,

    /**
     * Whether or not the local participant has joined a
     * {@code JitsiConference}. Used to trigger auto showing of the
     * {@code InfoDialog}.
     */
    _isConferenceJoined: Boolean,

    /**
     * The URL for a currently active live broadcast
     */
    _liveStreamViewURL: ?string,

    /**
     * True if the number of real participants in the call is less than 2. If in a lonely call, the
     * {@code InfoDialog} will be automatically shown.
     */
    _isLonelyCall: boolean,

    /**
     * Whether or not the toolbox, in which this component exists, is visible.
     */
    _toolboxVisible: boolean,

    /**
     * Invoked to toggle display of the info dialog.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether to show the label or not.
     */
    showLabel: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link InfoDialogButton}.
 */
type State = {

    /**
     * Cache the conference connection state to derive when transitioning from
     * not joined to join, in order to auto-show the InfoDialog.
     */
    hasConnectedToConference: boolean,

    /**
     * Whether or not {@code InfoDialog} should be visible.
     */
    showDialog: boolean
};

/**
 * A React Component for displaying a button which opens a dialog with
 * information about the conference and with ways to invite people.
 *
 * @extends Component
 */
class InfoDialogButton extends Component<Props, State> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props, state) {
        return {
            hasConnectedToConference: props._isConferenceJoined,
            showDialog: (props._toolboxVisible && state.showDialog)
                || (!state.hasConnectedToConference
                    && props._isConferenceJoined
                    && props._isLonelyCall
                    && props._toolboxVisible
                    && !props._disableAutoShow)
        };
    }

    /**
     * Initializes new {@code InfoDialogButton} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            hasConnectedToConference: props._isConferenceJoined,
            showDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
        this._onClickOverflowMenuButton
            = this._onClickOverflowMenuButton.bind(this);
    }

    /**
     * Update dial-in numbers {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (!this.props._dialIn.numbers) {
            this.props.dispatch(updateDialInNumbers());
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialIn, _liveStreamViewURL, showLabel, t } = this.props;
        const { showDialog } = this.state;

        if (showLabel) {
            return (
                <OverflowMenuItem
                    accessibilityLabel = { t('info.accessibilityLabel') }
                    icon = 'icon-info'
                    key = 'info-button'
                    onClick = { this._onClickOverflowMenuButton }
                    text = { t('info.label') } />
            );
        }

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = {
                        <InfoDialog
                            dialIn = { _dialIn }
                            isInlineDialog = { true }
                            liveStreamViewURL = { _liveStreamViewURL }
                            onClose = { this._onDialogClose } /> }
                    isOpen = { showDialog }
                    onClose = { this._onDialogClose }
                    position = { 'top right' }>
                    <ToolbarButton
                        accessibilityLabel = { t('info.accessibilityLabel') }
                        icon = { IconInfo }
                        onClick = { this._onDialogToggle }
                        tooltip = { t('info.tooltip') } />
                </InlineDialog>
            </div>
        );
    }

    _onDialogClose: () => void;

    /**
     * Hides {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.setState({ showDialog: false });
    }

    _onClickOverflowMenuButton: () => void;

    /**
     * Opens the Info dialog.
     *
     * @returns {void}
     */
    _onClickOverflowMenuButton() {
        const { _dialIn, _liveStreamViewURL } = this.props;

        this.props.dispatch(openDialog(InfoDialog, {
            dialIn: _dialIn,
            liveStreamViewURL: _liveStreamViewURL,
            isInlineDialog: false
        }));
    }

    _onDialogToggle: () => void;

    /**
     * Toggles the display of {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        sendAnalytics(createToolbarEvent('info'));

        this.setState({ showDialog: !this.state.showDialog });
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InfoDialogButton}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialIn: Object,
 *     _disableAutoShow: boolean,
 *     _isConferenceIsJoined: boolean,
 *     _liveStreamViewURL: string,
 *     _isLonelyCall: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const currentLiveStreamingSession
        = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const { iAmRecorder, iAmSipGateway } = state['features/base/config'];

    return {
        _dialIn: state['features/invite'],
        _disableAutoShow: iAmRecorder || iAmSipGateway,
        _isConferenceJoined:
            Boolean(state['features/base/conference'].conference),
        _liveStreamViewURL:
            currentLiveStreamingSession
                && currentLiveStreamingSession.liveStreamViewURL,
        _isLonelyCall: getParticipantCount(state) < 2,
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default translate(connect(_mapStateToProps)(InfoDialogButton));
