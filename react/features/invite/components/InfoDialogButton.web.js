import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ToolbarButton, TOOLTIP_TO_POPUP_POSITION } from '../../toolbox';

import { setInfoDialogVisibility } from '../actions';

import InfoDialog from './InfoDialog';

declare var interfaceConfig: Object;

const { INITIAL_TOOLBAR_TIMEOUT } = interfaceConfig;

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
         * Whether or not {@code InfoDialog} should be displayed.
         */
        _showDialog: PropTypes.bool,

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
         * The timeout to automatically hide the {@code InfoDialog} if it has
         * not been interacted with.
         *
         * @type {timeoutID}
         */
        this._autoHideDialogTimeout = null;

        this.state = {
            /**
             * Whether or not the dialog has been interacted with somehow, such
             * as clicking or toggle display. A value of true will prevent the
             * dialog from being automatically hidden.
             */
            hasInteractedWithDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogMouseOver = this._onDialogMouseOver.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
    }

    /**
     * Set a timeout to automatically hide the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._autoHideDialogTimeout = setTimeout(() => {
            this._maybeHideDialog();
        }, INITIAL_TOOLBAR_TIMEOUT);
    }

    /**
     * Update the state when the {@code InfoDialog} visibility has been updated.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        if (!this.state.hasInteractedWithDialog
            && (nextProps._showDialog !== this.props._showDialog)) {
            this.setState({ hasInteractedWithDialog: true });
        }

        if (!nextProps._toolboxVisible && this.props._toolboxVisible) {
            this._onDialogClose();
        }
    }

    /**
     * Clear the timeout to automatically show the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearTimeout(this._autoHideDialogTimeout);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _showDialog, _toolboxVisible, tooltipPosition } = this.props;
        const buttonConfiguration = {
            ...DEFAULT_BUTTON_CONFIGURATION,
            classNames: [
                ...DEFAULT_BUTTON_CONFIGURATION.classNames,
                _showDialog ? 'toggled button-active' : ''
            ]
        };

        return (
            <InlineDialog
                content = { <InfoDialog
                    onClose = { this._onDialogClose }
                    onMouseOver = { this._onDialogMouseOver } /> }
                isOpen = { _toolboxVisible && _showDialog }
                onClose = { this._onDialogClose }
                onContentClick = { this._onDialogInteract }
                position = { TOOLTIP_TO_POPUP_POSITION[tooltipPosition] }>
                <ToolbarButton
                    button = { buttonConfiguration }
                    onClick = { this._onDialogToggle }
                    tooltipPosition = { tooltipPosition } />
            </InlineDialog>
        );
    }

    /**
     * Callback invoked after a timeout to trigger hiding of the
     * {@code InfoDialog} if there has been no interaction with the dialog
     * and the dialog is currently showing.
     *
     * @private
     * @returns {void}
     */
    _maybeHideDialog() {
        if (!this.state.hasInteractedWithDialog && this.props._showDialog) {
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
     * Updates the internal state to mark the {@code InfoDialog} as having been
     * interacted with.
     *
     * @private
     * @returns {void}
     */
    _onDialogMouseOver() {
        if (!this.state.hasInteractedWithDialog) {
            this.setState({ hasInteractedWithDialog: true });
        }
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
 *     _showDialog: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _showDialog: state['features/invite'].infoDialogVisible,
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default connect(_mapStateToProps)(InfoDialogButton);
