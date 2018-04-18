import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { getParticipantCount } from '../../base/participants';
import { ToolbarButton } from '../../toolbox';

import { updateDialInNumbers } from '../actions';

import { InfoDialog } from './info-dialog';

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
         * The {@code JitsiConference} for the current conference.
         */
        _conference: PropTypes.object,

        /**
         * The redux state representing the dial-in numbers feature.
         */
        _dialIn: PropTypes.object,

        /**
         * Whether or not the {@code InfoDialog} should display automatically
         * when in a lonely call.
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
     * Update the visibility of the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (this.state.showDialog && !nextProps._toolboxVisible) {
            this._onDialogClose();
        }

        if (!this.props._conference && nextProps._conference) {
            this._maybeAutoShowDialog();
        }
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
     * Invoked to trigger display of the {@code InfoDialog} if certain
     * conditions are met.
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
 *     _conference: Object,
 *     _dialIn: Object,
 *     _disableAutoShow: boolean,
 *     _liveStreamViewURL: string,
 *     _participantCount: number,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _conference: state['features/base/conference'].conference,
        _dialIn: state['features/invite'],
        _disableAutoShow: state['features/base/config'].iAmRecorder,
        _liveStreamViewURL: state['features/recording'].liveStreamViewURL,
        _participantCount:
            getParticipantCount(state['features/base/participants']),
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default translate(connect(_mapStateToProps)(InfoDialogButton));
