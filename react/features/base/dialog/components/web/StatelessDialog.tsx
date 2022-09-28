/* eslint-disable lines-around-comment */
import Modal, { ModalFooter } from '@atlaskit/modal-dialog';
import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { Component, ReactElement } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../i18n/functions';
import Button from '../../../ui/components/web/Button';
import { BUTTON_TYPES } from '../../../ui/constants';
import type { DialogProps } from '../../constants';

import ModalHeader from './ModalHeader';

/**
 * The ID to be used for the cancel button if enabled.
 *
 * @type {string}
 */
const CANCEL_BUTTON_ID = 'modal-dialog-cancel-button';

/**
 * The ID to be used for the ok button if enabled.
 *
 * @type {string}
 */
const OK_BUTTON_ID = 'modal-dialog-ok-button';

/**
 * The type of the React {@code Component} props of {@link StatelessDialog}.
 *
 * @static
 */
interface Props extends DialogProps, WithTranslation {

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * Custom dialog header that replaces the standard heading.
     */
    customHeader?: ReactElement<any> | Function;

    /**
     * Disables dismissing the dialog when the blanket is clicked. Enabled
     * by default.
     */
    disableBlanketClickDismiss: boolean;

    /*
     * True if listening for the Enter key should be disabled.
     */
    disableEnter: boolean;

    /**
     * If true, no footer will be displayed.
     */
    disableFooter?: boolean;

    /**
     * If true, the cancel button will not display but cancel actions, like
     * clicking the blanket, will cancel.
     */
    hideCancelButton: boolean;

    /**
     * If true, the close icon button will not be displayed.
     */
    hideCloseIconButton: boolean;

    /**
     * Whether the dialog is modal. This means clicking on the blanket will
     * leave the dialog open. No cancel button.
     */
    isModal: boolean;

    /**
     * The handler for the event when clicking the 'confirmNo' button.
     * Defaults to onCancel if absent.
     */
    onDecline?: () => void;

    /**
     * Callback invoked when setting the ref of the Dialog.
     */
    onDialogRef?: Function;

    /**
     * Disables rendering of the submit button.
     */
    submitDisabled: boolean;

    /**
     * Width of the dialog, can be:
     * - 'small' (400px), 'medium' (600px), 'large' (800px),
     *   'x-large' (968px)
     * - integer value for pixel width
     * - string value for percentage.
     */
    width: string;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The theme.
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        footer: {
            boxShadow: 'none'
        },

        buttonContainer: {
            display: 'flex',

            '& > button:first-child': {
                marginRight: theme.spacing(2)
            }
        }
    };
};

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class StatelessDialog extends Component<Props> {
    static defaultProps = {
        hideCloseIconButton: false
    };

    /**
     * Initializes a new {@code StatelessDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onDialogDismissed = this._onDialogDismissed.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._renderFooter = this._renderFooter.bind(this);
        this._onDialogRef = this._onDialogRef.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            customHeader,
            children,
            hideCloseIconButton,
            t,
            titleString,
            titleKey,
            width
        } = this.props;

        return (
            <Modal
                autoFocus = { true }
                components = {{
                    // @ts-ignore
                    Header: customHeader ? customHeader : props => (
                        // @ts-ignore
                        <ModalHeader
                            { ...props }
                            heading = { titleString || t(titleKey ?? '') }
                            hideCloseIconButton = { hideCloseIconButton } />
                    )
                }}
                footer = { this._renderFooter }
                i18n = { this.props.i18n }
                onClose = { this._onDialogDismissed }
                onDialogDismissed = { this._onDialogDismissed }
                shouldCloseOnEscapePress = { true }
                width = { width || 'medium' }>
                <div
                    onKeyPress = { this._onKeyPress }
                    ref = { this._onDialogRef }>
                    <form
                        className = 'modal-dialog-form'
                        id = 'modal-dialog-form'
                        onSubmit = { this._onSubmit }>
                        { children }
                    </form>
                </div>
            </Modal>
        );
    }

    /**
     * Returns a ReactElement to display buttons for closing the modal.
     *
     * @param {Object} propsFromModalFooter - The props passed in from the
     * {@link ModalFooter} component.
     * @private
     * @returns {ReactElement}
     */
    _renderFooter(propsFromModalFooter: any) {
        // Filter out falsy (null) values because {@code ButtonGroup} will error
        // if passed in anything but buttons with valid type props.
        const buttons = [
            this._renderCancelButton(),
            this._renderOKButton()
        ].filter(Boolean);

        if (this.props.disableFooter) {
            return null;
        }

        return (
            <ModalFooter
                className = { this.props.classes.footer }
                showKeyline = { propsFromModalFooter.showKeyline } >
                {

                    /**
                     * Atlaskit has this empty span (JustifySim) so...
                     */
                }
                <span />
                <div className = { this.props.classes.buttonContainer }>
                    { buttons }
                </div>
            </ModalFooter>
        );
    }

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (!this.props.isModal) {
            const { onCancel } = this.props;

            onCancel?.();
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
    _onSubmit(value?: any) {
        const { onSubmit } = this.props;

        onSubmit?.(value);
    }

    /**
     * Renders Cancel button.
     *
     * @private
     * @returns {ReactElement|null} The Cancel button if enabled and dialog is
     * not modal.
     */
    _renderCancelButton() {
        if (this.props.cancelDisabled
            || this.props.isModal
            || this.props.hideCancelButton) {
            return null;
        }

        const {
            t,
            onDecline
        } = this.props;

        return (
            <Button
                accessibilityLabel = { t(this.props.cancelKey || 'dialog.Cancel') }
                id = { CANCEL_BUTTON_ID }
                key = { CANCEL_BUTTON_ID }
                label = { t(this.props.cancelKey || 'dialog.Cancel') }
                onClick = { onDecline || this._onCancel }
                size = 'small'
                type = { BUTTON_TYPES.TERTIARY } />
        );
    }

    /**
     * Renders OK button.
     *
     * @private
     * @returns {ReactElement|null} The OK button if enabled.
     */
    _renderOKButton() {
        const {
            submitDisabled,
            t
        } = this.props;

        if (submitDisabled) {
            return null;
        }

        return (
            <Button
                accessibilityLabel = { t(this.props.okKey || 'dialog.Ok') }
                disabled = { this.props.okDisabled }
                id = { OK_BUTTON_ID }
                key = { OK_BUTTON_ID }
                label = { t(this.props.okKey || 'dialog.Ok') }
                onClick = { this._onSubmit }
                size = 'small' />
        );
    }

    /**
     * Callback invoked when setting the ref of the dialog's child passing the Modal ref.
     * It is done this way because we cannot directly access the ref of the Modal component.
     *
     * @param {HTMLElement} element - The DOM element for the dialog.
     * @private
     * @returns {void}
     */
    _onDialogRef(element?: any) {
        this.props.onDialogRef?.(element?.parentNode);
    }

    /**
     * Handles 'Enter' key in the dialog to submit/hide dialog depending on
     * the available buttons and their disabled state.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyPress(event: React.KeyboardEvent) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'Enter' && !this.props.disableEnter) {
            event.preventDefault();
            event.stopPropagation();

            if (this.props.submitDisabled && !this.props.cancelDisabled) {
                this._onCancel();
            } else if (!this.props.okDisabled) {
                this._onSubmit();
            }
        }
    }
}

export default translate(withStyles(styles)(StatelessDialog));
