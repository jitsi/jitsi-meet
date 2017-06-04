import AKButton from '@atlaskit/button';
import AKButtonGroup from '@atlaskit/button-group';
import ModalDialog from '@atlaskit/modal-dialog';
import React, { Component } from 'react';

import { translate } from '../../i18n';

import { dialogPropTypes } from '../constants';

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class StatelessDialog extends Component {

    /**
     * Web dialog component's property types.
     *
     * @static
     */
    static propTypes = {
        ...dialogPropTypes,

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
         * 'x-large' (968px)
         * - integer value for pixel width
         * - string value for percentage
         */
        width: React.PropTypes.string

    };

    /**
     * Initializes a new Dialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

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
            </ModalDialog>);
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
     * Render cancel button.
     *
     * @returns {*} The cancel button if enabled and dialog is not modal.
     * @private
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
     * Render component in dialog footer.
     *
     * @returns {ReactElement}
     * @private
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
     * Render component in dialog header.
     *
     * @returns {ReactElement}
     * @private
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
     * Render ok button.
     *
     * @returns {*} The ok button if enabled.
     * @private
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

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (this.props.isModal) {
            return;
        }

        this.props.onCancel();
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
}

export default translate(StatelessDialog);
