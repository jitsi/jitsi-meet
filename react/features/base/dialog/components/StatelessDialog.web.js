import AKButton from '@atlaskit/button';
import AKButtonGroup from '@atlaskit/button-group';
import ModalDialog from '@atlaskit/modal-dialog';
import React, { Component } from 'react';

import { translate } from '../../i18n';

import { DIALOG_PROP_TYPES } from '../constants';

/**
 * The ID to be used for the cancel button if enabled.
 * @type {string}
 */
const CANCEL_BUTTON_ID = 'modal-dialog-cancel-button';

/**
 * The ID to be used for the ok button if enabled.
 * @type {string}
 */
const OK_BUTTON_ID = 'modal-dialog-ok-button';

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class StatelessDialog extends Component {
    /**
     * {@code StatelessDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...DIALOG_PROP_TYPES,

        /**
         * This is the body of the dialog, the component children.
         */
        children: React.PropTypes.node,

        /**
         * Disables dismissing the dialog when the blanket is clicked. Enabled
         * by default.
         */
        disableBlanketClickDismiss: React.PropTypes.bool,

        /**
         * Whether the dialog is modal. This means clicking on the blanket will
         * leave the dialog open. No cancel button.
         */
        isModal: React.PropTypes.bool,

        /**
         * Disables rendering of the submit button.
         */
        submitDisabled: React.PropTypes.bool,

        /**
         * Width of the dialog, can be:
         * - 'small' (400px), 'medium' (600px), 'large' (800px),
         *   'x-large' (968px)
         * - integer value for pixel width
         * - string value for percentage
         */
        width: React.PropTypes.string
    };

    /**
     * Initializes a new {@code StatelessDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onDialogDismissed = this._onDialogDismissed.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._setDialogElement = this._setDialogElement.bind(this);
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateButtonFocus();
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @param {Object} prevProps - The previous properties, before the update.
     * @returns {void}
     */
    componentDidUpdate(prevProps) {
        // if there is an update in any of the buttons enable/disable props
        // update the focus if needed
        if (prevProps.okDisabled !== this.props.okDisabled
            || prevProps.cancelDisabled !== this.props.cancelDisabled
            || prevProps.submitDisabled !== this.props.submitDisabled) {
            this._updateButtonFocus();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                onKeyDown = { this._onKeyDown }
                ref = { this._setDialogElement }>
                <ModalDialog
                    footer = { this._renderFooter() }
                    header = { this._renderHeader() }
                    isOpen = { true }
                    onDialogDismissed = { this._onDialogDismissed }
                    width = { this.props.width || 'medium' }>
                    <div>
                        <form
                            className = 'modal-dialog-form'
                            id = 'modal-dialog-form'
                            onSubmit = { this._onSubmit }>
                            { this.props.children }
                        </form>
                    </div>
                </ModalDialog>
            </div>
        );
    }

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (!this.props.isModal) {
            this.props.onCancel();
        }
    }

    /**
     * Handles click on the blanket area.
     *
     * @returns {void}
     */
    _onDialogDismissed() {
        if (!this.props.disableBlanketClickDismiss) {
            this._onCancel();
        }
    }

    /**
     * Dispatches the action when submitting the dialog.
     *
     * @private
     * @param {string} value - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value) {
        this.props.onSubmit(value);
    }

    /**
     * Renders Cancel button.
     *
     * @private
     * @returns {*} The Cancel button if enabled and dialog is not modal.
     */
    _renderCancelButton() {
        if (this.props.cancelDisabled || this.props.isModal) {
            return null;
        }

        return (
            <AKButton
                appearance = 'subtle'
                id = { CANCEL_BUTTON_ID }
                onClick = { this._onCancel }>
                { this.props.t(this.props.cancelTitleKey || 'dialog.Cancel') }
            </AKButton>
        );
    }

    /**
     * Renders component in dialog footer.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderFooter() {
        return (
            <footer className = 'modal-dialog-footer'>
                <AKButtonGroup>
                    { this._renderCancelButton() }
                    { this._renderOKButton() }
                </AKButtonGroup>
            </footer>
        );
    }

    /**
     * Renders component in dialog header.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderHeader() {
        const { t } = this.props;

        return (
            <header>
                <h3>
                    { this.props.titleString || t(this.props.titleKey) }
                </h3>
            </header>
        );
    }

    /**
     * Renders OK button.
     *
     * @private
     * @returns {*} The OK button if enabled.
     */
    _renderOKButton() {
        if (this.props.submitDisabled) {
            return null;
        }

        return (
            <AKButton
                appearance = 'primary'
                form = 'modal-dialog-form'
                id = { OK_BUTTON_ID }
                isDisabled = { this.props.okDisabled }
                onClick = { this._onSubmit }>
                { this.props.t(this.props.okTitleKey || 'dialog.Ok') }
            </AKButton>
        );
    }

    /**
     * Sets the instance variable for the div containing the component's dialog
     * element so it can be accessed directly.
     *
     * @param {Object} element - The DOM element for the component's dialog.
     * @private
     * @returns {void}
     */
    _setDialogElement(element) {
        this._dialogElement = element;
    }

    /**
     * Handles 'Enter' key in the dialog to submit/hide dialog depending on
     * the available buttons and their disabled state.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        if (event.key === 'Enter') {
            if (this.props.submitDisabled && !this.props.cancelDisabled) {
                this._onCancel();
            } else if (!this.props.okDisabled) {
                this._onSubmit();
            }
        }
    }

    /**
     * Updates focused button, if we have a reference to the dialog element.
     * Focus on available button if there is no focus already.
     *
     * @private
     * @returns {void}
     */
    _updateButtonFocus() {
        if (this._dialogElement) {

            // if we have a focused element inside the dialog, skip changing
            // the focus
            if (this._dialogElement.contains(document.activeElement)) {
                return;
            }

            let buttonToFocus;

            if (this.props.submitDisabled) {
                buttonToFocus = this._dialogElement
                    .querySelector(`[id=${CANCEL_BUTTON_ID}]`);
            } else if (!this.props.okDisabled) {
                buttonToFocus = this._dialogElement
                    .querySelector(`[id=${OK_BUTTON_ID}]`);
            }

            if (buttonToFocus) {
                buttonToFocus.focus();
            }
        }
    }
}

export default translate(StatelessDialog);
