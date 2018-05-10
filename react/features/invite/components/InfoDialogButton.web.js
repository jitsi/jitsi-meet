import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { getParticipantCount } from '../../base/participants';
import { getActiveSession } from '../../recording';
import { ToolbarButton } from '../../toolbox';

import { updateDialInNumbers } from '../actions';

import { InfoDialog } from './info-dialog';

/**
 * The amount of time, in milliseconds, to wait until automatically showing
 * the {@code InfoDialog}. This is essentially a hack as automatic showing
 * should happen in a lonely call and some time is needed to populate
 * participants already in the call.
 */
const INFO_DIALOG_AUTO_SHOW_TIMEOUT = 1500;

/**
 * A React Component for displaying a button which opens a dialog with
 * information about the conference and with ways to invite people.
 *
 * @extends Component
 */
class InfoDialogButton extends Component {
    /**
     * {@code InfoDialogButton} component's property types.
     *
     * @static
     */
    static propTypes = {

        /**
         * The redux state representing the dial-in numbers feature.
         */
        _dialIn: PropTypes.object,

        /**
         * Whether or not the {@code InfoDialog} should display automatically
         * after {@link INFO_DIALOG_AUTO_SHOW_TIMEOUT}.
         */
        _disableAutoShow: PropTypes.bool,

        /**
         * The URL for a currently active live broadcast
         */
        _liveStreamViewURL: PropTypes.string,

        /**
         * The number of real participants in the call. If in a lonely call,
         * the {@code InfoDialog} will be automatically shown.
         */
        _participantCount: PropTypes.number,

        /**
         * Whether or not the toolbox, in which this component exists, are
         * visible.
         */
        _toolboxVisible: PropTypes.bool,

        /**
         * Invoked to toggle display of the info dialog
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes new {@code InfoDialogButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The timeout to automatically show the {@code InfoDialog} if it has
         * not been shown yet in a lonely call.
         *
         * @type {timeoutID}
         */
        this._autoShowTimeout = null;


        this.state = {
            /**
             * Whether or not {@code InfoDialog} should be visible.
             */
            showDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
    }

    /**
     * Set a timeout to automatically hide the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._autoShowTimeout = setTimeout(() => {
            this._maybeAutoShowDialog();
        }, INFO_DIALOG_AUTO_SHOW_TIMEOUT);

        if (!this.props._dialIn.numbers) {
            this.props.dispatch(updateDialInNumbers());
        }
    }

    /**
     * Update the visibility of the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (this.state.showDialog && !nextProps._toolboxVisible) {
            this._onDialogClose();
        }
    }

    /**
     * Clear the timeout to automatically show the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearTimeout(this._autoShowTimeout);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialIn, _liveStreamViewURL, t } = this.props;
        const { showDialog } = this.state;
        const iconClass = `icon-info ${showDialog ? 'toggled' : ''}`;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = {
                        <InfoDialog
                            dialIn = { _dialIn }
                            liveStreamViewURL = { _liveStreamViewURL }
                            onClose = { this._onDialogClose } /> }
                    isOpen = { showDialog }
                    onClose = { this._onDialogClose }
                    position = { 'top right' }>
                    <ToolbarButton
                        accessibilityLabel = 'Info'
                        iconName = { iconClass }
                        onClick = { this._onDialogToggle }
                        tooltip = { t('info.tooltip') } />
                </InlineDialog>
            </div>
        );
    }

    /**
     * Callback invoked after a timeout to trigger display of the
     * {@code InfoDialog} if certain conditions are met.
     *
     * @private
     * @returns {void}
     */
    _maybeAutoShowDialog() {
        if (this.props._participantCount < 2 && !this.props._disableAutoShow) {
            this.setState({ showDialog: true });
        }
    }

    /**
     * Hides {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.setState({ showDialog: false });
    }

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
 *     _liveStreamViewURL: string,
 *     _participantCount: number,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const currentLiveStreamingSession
        = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);

    return {
        _dialIn: state['features/invite'],
        _disableAutoShow: state['features/base/config'].iAmRecorder,
        _liveStreamViewURL: currentLiveStreamingSession
            && currentLiveStreamingSession.liveStreamViewURL,
        _participantCount:
            getParticipantCount(state['features/base/participants']),
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default translate(connect(_mapStateToProps)(InfoDialogButton));
