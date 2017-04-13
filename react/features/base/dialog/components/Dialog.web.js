import AKButton from '@atlaskit/button';
import AKButtonGroup from '@atlaskit/button-group';
import ModalDialog from '@atlaskit/modal-dialog';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../i18n';

import AbstractDialog from './AbstractDialog';

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class Dialog extends AbstractDialog {

    /**
     * Web dialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * This is the body of the dialog, the component children.
         */
        children: React.PropTypes.node,

        /**
         * Whether the dialog is modal. This means clicking on the blanket will
         * leave the dialog open. No cancel button.
         */
        isModal: React.PropTypes.bool,

        /**
         * Width of the dialog, can be:
         * - 'small' (400px), 'medium' (600px), 'large' (800px),
         * 'x-large' (968px)
         * - integer value for pixel width
         * - string value for percentage
         */
        width: React.PropTypes.string
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
                onDialogDismissed = { this._onCancel }
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

        super._onCancel();
    }
}

export default translate(connect()(Dialog));
