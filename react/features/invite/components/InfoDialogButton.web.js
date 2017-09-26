import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ToolbarButton, TOOLTIP_TO_POPUP_POSITION } from '../../toolbox';
import { getParticipantCount } from '../../base/participants';

import { setInfoDialogVisibility } from '../actions';

import InfoDialog from './InfoDialog';

/**
 * A configuration object to describe how {@code ToolbarButton} should render
 * the button.
 *
 * @type {object}
 */
const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'info',
    classNames: [ 'button', 'icon-info' ],
    enabled: true,
    id: 'toolbar_button_info',
    tooltipKey: 'info.tooltip'
};

/**
 * The amount of time, in milliseconds, to wait until automatically showing
 * the {@code InfoDialog}
 */
const INFO_DIALOG_AUTO_SHOW_TIME = 3000;

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
         * The number of real participants in the call. If in a lonely call,
         * the {@code InfoDialog} will be automatically shown.
         */
        _participantCount: PropTypes.number,

        /**
         * Whether or not {@code InfoDialog} should be displayed.
         */
        _showDialog: PropTypes.bool,

        /**
         * Whether or not the toolbars, in which this component exists, are
         * visible.
         */
        _visible: PropTypes.bool,

        /**
         * Invoked to toggle display of the info dialog
         */
        dispatch: PropTypes.func,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes new {@code ToolbarButtonWithDialog} instance.
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
             * Whether or not the dialog has displayed at least once.
             */
            hasToggled: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
    }

    /**
     * Set a timeout to automatically show the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._autoShowTimeout = setTimeout(() => {
            this._maybeAutoShowDialog();
        }, INFO_DIALOG_AUTO_SHOW_TIME);
    }

    /**
     * Update the state when the {@code InfoDialog} has been seen for the first
     * time.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        if (!this.state.hasToggled && nextProps._showDialog) {
            this.setState({ hasToggled: true });
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
        const { _showDialog, _visible, tooltipPosition } = this.props;
        const buttonConfiguration = {
            ...DEFAULT_BUTTON_CONFIGURATION,
            classNames: [
                ...DEFAULT_BUTTON_CONFIGURATION.classNames,
                _showDialog ? 'toggled button-active' : ''
            ]
        };

        return (
            <InlineDialog
                content = { <InfoDialog onClose = { this._onDialogClose } /> }
                isOpen = { _visible && _showDialog }
                onClose = { this._onDialogClose }
                position = { TOOLTIP_TO_POPUP_POSITION[tooltipPosition] }>
                <ToolbarButton
                    button = { buttonConfiguration }
                    onClick = { this._onDialogToggle }
                    tooltipPosition = { tooltipPosition } />
            </InlineDialog>
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
        if (this.props._participantCount < 2 && !this.state.hasToggled) {
            this._onDialogToggle();
        }
    }

    /**
     * Hides {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.props.dispatch(setInfoDialogVisibility(false));
    }

    /**
     * Toggles the display of {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        this.props.dispatch(setInfoDialogVisibility(!this.props._showDialog));
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InfoDialogButton}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _participantsCount: number,
 *     _showDialog: boolean,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _participantCount:
            getParticipantCount(state['features/base/participants']),
        _showDialog: state['features/invite'].infoDialogVisible,
        _visible: state['features/toolbox'].visible
    };
}

export default connect(_mapStateToProps)(InfoDialogButton);
