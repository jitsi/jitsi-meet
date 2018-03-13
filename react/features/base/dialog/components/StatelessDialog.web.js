// @flow

import Button, { ButtonGroup } from '@atlaskit/button';
import { withContextFromProps } from '@atlaskit/layer-manager';
import Modal, { ModalFooter } from '@atlaskit/modal-dialog';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../i18n';

import type { DialogProps } from '../constants';

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
 * The type of the React {@code Component} props of {@link StatelessDialog}.
 *
 * @static
 */
type Props = {
    ...DialogProps,

    i18n: Object,

    /**
     * Disables dismissing the dialog when the blanket is clicked. Enabled
     * by default.
     */
    disableBlanketClickDismiss: boolean,

    /**
     * Whether the dialog is modal. This means clicking on the blanket will
     * leave the dialog open. No cancel button.
     */
    isModal: boolean,

    /**
     * Disables rendering of the submit button.
     */
    submitDisabled: boolean,

    /**
     * Width of the dialog, can be:
     * - 'small' (400px), 'medium' (600px), 'large' (800px),
     *   'x-large' (968px)
     * - integer value for pixel width
     * - string value for percentage
     */
    width: string
};

/**
 * ContexTypes is used as a workaround for Atlaskit's modal being displayed
 * outside of the normal App hierarchy, thereby losing context. ContextType
 * is responsible for taking its props and passing them into children.
 *
 * @type {ReactElement}
 */
const ContextProvider = withContextFromProps({
    i18n: PropTypes.object
});

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class StatelessDialog extends Component<Props> {
    /**
     * The functional component to be used for rendering the modal footer.
     */
    _Footer: ?Function

    _dialogElement: ?HTMLElement;

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

        this._Footer = this._createFooterConstructor(props);
    }

    /**
     * React Component method that executes before the component is updated.
     *
     * @inheritdoc
     * @param {Object} nextProps - The next properties, before the update.
     * @returns {void}
     */
    componentWillUpdate(nextProps) {
        // If button states have changed, update the Footer constructor function
        // so buttons of the proper state are rendered.
        if (nextProps.okDisabled !== this.props.okDisabled
                || nextProps.cancelDisabled !== this.props.cancelDisabled
                || nextProps.submitDisabled !== this.props.submitDisabled) {
            this._Footer = this._createFooterConstructor(nextProps);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            children,
            t /* The following fixes a flow error: */ = _.identity,
            titleString,
            titleKey,
            width
        } = this.props;

        return (
            <Modal
                autoFocus = { true }
                footer = { this._Footer }
                heading = { titleString || t(titleKey) }
                i18n = { this.props.i18n }
                onClose = { this._onDialogDismissed }
                onDialogDismissed = { this._onDialogDismissed }
                shouldCloseOnEscapePress = { true }
                width = { width || 'medium' }>
                {

                    /**
                     * Wrapping the contents of {@link Modal} with
                     * {@link ContextProvider} is a workaround for the
                     * i18n context becoming undefined as modal gets rendered
                     * outside of the normal react app context.
                     */
                }
                <ContextProvider i18n = { this.props.i18n }>
                    <div
                        onKeyDown = { this._onKeyDown }
                        ref = { this._setDialogElement }>
                        <form
                            className = 'modal-dialog-form'
                            id = 'modal-dialog-form'
                            onSubmit = { this._onSubmit }>
                            { children }
                        </form>
                    </div>
                </ContextProvider>
            </Modal>
        );
    }

    _onCancel: () => Function;

    /**
     * Returns a functional component to be used for the modal footer.
     *
     * @param {Object} options - The configuration for how the buttons in the
     * footer should display. Essentially {@code StatelessDialog} props should
     * be passed in.
     * @private
     * @returns {ReactElement}
     */
    _createFooterConstructor(options) {
        // Filter out falsy (null) values because {@code ButtonGroup} will error
        // if passed in anything but buttons with valid type props.
        const buttons = [
            this._renderOKButton(options),
            this._renderCancelButton(options)
        ].filter(Boolean);

        return function Footer(modalFooterProps) {
            return (
                <ModalFooter showKeyline = { modalFooterProps.showKeyline } >
                    {

                        /**
                         * Atlaskit has this empty span (JustifySim) so...
                         */
                    }
                    <span />
                    <ButtonGroup>
                        { buttons }
                    </ButtonGroup>
                </ModalFooter>
            );
        };
    }

    _onCancel: () => void;

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (!this.props.isModal) {
            const { onCancel } = this.props;

            onCancel && onCancel();
        }
    }

    _onDialogDismissed: () => void;

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

    _onSubmit: (?string) => void;

    /**
     * Dispatches the action when submitting the dialog.
     *
     * @private
     * @param {string} value - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value) {
        const { onSubmit } = this.props;

        onSubmit && onSubmit(value);
    }

    /**
     * Renders Cancel button.
     *
     * @param {Object} options - The configuration for the Cancel button.
     * @param {boolean} options.cancelDisabled - True if the cancel button
     * should not be rendered.
     * @param {string} options.cancelTitleKey - The translation key to use as
     * text on the button.
     * @param {boolean} options.isModal - True if the cancel button should not
     * be rendered.
     * @private
     * @returns {ReactElement|null} The Cancel button if enabled and dialog is
     * not modal.
     */
    _renderCancelButton(options = {}) {
        if (options.cancelDisabled || options.isModal) {
            return null;
        }

        const {
            t /* The following fixes a flow error: */ = _.identity
        } = this.props;

        return (
            <Button
                appearance = 'subtle'
                id = { CANCEL_BUTTON_ID }
                key = 'cancel'
                onClick = { this._onCancel }
                type = 'button'>
                { t(options.cancelTitleKey || 'dialog.Cancel') }
            </Button>
        );
    }

    /**
     * Renders OK button.
     *
     * @param {Object} options - The configuration for the OK button.
     * @param {boolean} options.okDisabled - True if the button should display
     * as disabled and clicking should have no effect.
     * @param {string} options.okTitleKey - The translation key to use as text
     * on the button.
     * @param {boolean} options.submitDisabled - True if the button should not
     * be rendered.
     * @private
     * @returns {ReactElement|null} The OK button if enabled.
     */
    _renderOKButton(options = {}) {
        if (options.submitDisabled) {
            return null;
        }

        const {
            t /* The following fixes a flow error: */ = _.identity
        } = this.props;

        return (
            <Button
                appearance = 'primary'
                form = 'modal-dialog-form'
                id = { OK_BUTTON_ID }
                isDisabled = { options.okDisabled }
                key = 'submit'
                onClick = { this._onSubmit }
                type = 'button'>
                { t(options.okTitleKey || 'dialog.Ok') }
            </Button>
        );
    }

    _setDialogElement: (?HTMLElement) => void;

    /**
     * Sets the instance variable for the div containing the component's dialog
     * element so it can be accessed directly.
     *
     * @param {HTMLElement} element - The DOM element for the component's
     * dialog.
     * @private
     * @returns {void}
     */
    _setDialogElement(element: ?HTMLElement) {
        this._dialogElement = element;
    }

    _onKeyDown: (Object) => void;

    /**
     * Handles 'Enter' key in the dialog to submit/hide dialog depending on
     * the available buttons and their disabled state.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'Enter') {
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

export default translate(StatelessDialog);
