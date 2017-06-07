import AKButton from '@atlaskit/button';
import AKButtonGroup from '@atlaskit/button-group';
import ModalDialog from '@atlaskit/modal-dialog';
import React, { Component } from 'react';

import { translate } from '../../i18n';

import { DIALOG_PROP_TYPES } from '../constants';

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
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
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
                id = 'modal-dialog-cancel-button'
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
                <h2>
                    { this.props.titleString || t(this.props.titleKey) }
                </h2>
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
                id = 'modal-dialog-ok-button'
                isDisabled = { this.props.okDisabled }
                onClick = { this._onSubmit }>
                { this.props.t(this.props.okTitleKey || 'dialog.Ok') }
            </AKButton>
        );
    }
}

export default translate(StatelessDialog);
