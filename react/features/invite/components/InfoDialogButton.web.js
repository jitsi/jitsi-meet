/* global interfaceConfig */

import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import {
    ToolbarButton,
    ToolbarButtonV2,
    TOOLTIP_TO_POPUP_POSITION
} from '../../toolbox';

import { setInfoDialogVisibility, updateDialInNumbers } from '../actions';
import { InfoDialog } from './info-dialog';

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
         * Phone numbers for dialing into the conference.
         */
        _dialInNumbers: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.array
        ]),

        /**
         * Whether or not the {@code InfoDialog} should close by itself after a
         * a timeout.
         */
        _shouldAutoClose: PropTypes.bool,

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
        if (this.props._shouldAutoClose) {
            this._setAutoCloseTimeout();
        }

        if (!this.props._dialInNumbers) {
            this.props.dispatch(updateDialInNumbers());
        }
    }

    /**
     * Set or clear the timeout to automatically hide the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        // If the _shouldAutoClose flag has been updated to be true then make
        // sure to set _autoHideDialogTimeout.
        if (this.props._shouldAutoClose && !prevProps._shouldAutoClose) {
            this._setAutoCloseTimeout();
        } else {
            this._clearAutoCloseTimeout();
        }
    }

    /**
     * Update the visibility of the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(nextProps) {
        // Ensure the dialog is closed when the toolbox becomes hidden.
        if (nextProps._showDialog && !nextProps._toolboxVisible) {
            this._onDialogClose();
        }
    }

    /**
     * Clear the timeout to automatically show the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._clearAutoCloseTimeout();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return interfaceConfig._USE_NEW_TOOLBOX
            ? this._renderNewToolbarButton()
            : this._renderOldToolbarButton();
    }

    /**
     * Cancels the timeout to automatically hide the {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _clearAutoCloseTimeout() {
        clearTimeout(this._autoHideDialogTimeout);
        this._autoHideDialogTimeout = null;
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
     * Cancels the timeout to automatically hide the {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogMouseOver() {
        this._clearAutoCloseTimeout();
    }

    /**
     * Toggles the display of {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        sendAnalytics(createToolbarEvent('info'));

        this.props.dispatch(setInfoDialogVisibility(!this.props._showDialog));
    }

    /**
     * Renders a React Element for the {@code InfoDialog} using legacy
     * {@code ToolbarButton}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderOldToolbarButton() {
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
                    autoUpdateNumbers = { false }
                    onClose = { this._onDialogClose }
                    onMouseOver = { this._onDialogMouseOver } /> }
                isOpen = { _toolboxVisible && _showDialog }
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
     * Renders a React Element for the {@code InfoDialog} using the newer
     * {@code ToolbarButtonV2}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNewToolbarButton() {
        const { _showDialog, _toolboxVisible, t } = this.props;
        const iconClass = `icon-info ${_showDialog ? 'toggled' : ''}`;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = { <InfoDialog
                        autoUpdateNumbers = { false }
                        onClose = { this._onDialogClose }
                        onMouseOver = { this._onDialogMouseOver } /> }
                    isOpen = { _toolboxVisible && _showDialog }
                    onClose = { this._onDialogClose }
                    position = { 'top right' }>
                    <ToolbarButtonV2
                        iconName = { iconClass }
                        onClick = { this._onDialogToggle }
                        tooltip = { t('info.tooltip') } />
                </InlineDialog>
            </div>
        );
    }

    /**
     * Set a timeout to automatically hide the {@code InfoDialog}.
     *
     * @private
     * @returns {void}
     */
    _setAutoCloseTimeout() {
        this._clearAutoCloseTimeout();

        this._autoHideDialogTimeout = setTimeout(() => {
            if (this.props._showDialog) {
                this._onDialogClose();
            }
        }, INITIAL_TOOLBAR_TIMEOUT);
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InfoDialogButton}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialInNumbers: Array,
 *     _shouldAutoClose: boolean,
 *     _showDialog: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        infoDialogVisible,
        infoDialogWillAutoClose,
        numbers
    } = state['features/invite'];

    return {
        _dialInNumbers: numbers,
        _shouldAutoClose: infoDialogWillAutoClose,
        _showDialog: infoDialogVisible,
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default translate(connect(_mapStateToProps)(InfoDialogButton));
