/* eslint-disable no-confusing-arrow */
// @flow

import Form, {
    CheckboxField,
    ErrorMessage,
    Field,
    FormFooter,
    HelperMessage,
    ValidMessage
} from '@atlaskit/form';
import Button, { ButtonGroup } from '@atlaskit/button';
import Modal from '@atlaskit/modal-dialog';
import { Checkbox } from '@atlaskit/checkbox';
import TextField from '@atlaskit/textfield';
import React, { Component, Fragment } from 'react';
import type { Dispatch } from 'redux';

import { hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
type Props = {

  /**
   * The display name for the local participant obtained from the redux store.
   */
  _localDisplayName: string,

  /**
   * The JitsiConference from which stats will be pulled.
   */
  conference: Object,

  /**
   * Invoked to add a meeting URL to a calendar event.
   */
  dispatch: Dispatch<any>,

  i18n: Object,

  /**
   * The function to translate human-readable text.
   */
  t: Function
};

/**
 * The exported React {@code Component}.
 */
let LoginDialog_; // eslint-disable-line prefer-const

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class LoginDialog extends Component<Props> {

    _dialogElement: ?HTMLElement;

    /**
     * Initializes a new LoginDialog instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onDialogDismissed = this._onDialogDismissed.bind(this);
        this._setDialogElement = this._setDialogElement.bind(this);
    }

    _onSubmit: (Object) => void;

    /**
     * Submit login data.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onSubmit(data) {
        const { dispatch } = this.props;

        console.log('form data', data);

        return new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
            const name = '테스트';

            dispatch(updateSettings({ displayName: name }));
            dispatch(updateSettings({ email: 'test@postech.ac.kr' }));
            this._onCancel();
        });
    }

    _onCancel: () => void;

    /**
     * Cancel dialog.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(hideDialog(LoginDialog_));
    }

    /**
     * Validates the username.
     *
     * @param {string} value - Username value having changed.
     * @private
     * @returns {boolean}
     */
    validateUsername(value) {
        return value && value.length < 5 ? 'TOO_SHORT' : undefined;
    }

    /**
     * Validates the password.
     *
     * @param {string} value - Password value having changed.
     * @private
     * @returns {boolean}
     */
    validatePassword(value) {
        return value && value.length < 8 ? 'TOO_SHORT' : undefined;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <Modal
                autoFocus = { true }
                heading = { t('dialog.login') }
                i18n = { this.props.i18n }
                onClose = { this._onDialogDismissed }
                onDialogDismissed = { this._onDialogDismissed }
                shouldCloseOnEscapePress = { true }
                width = { 'small' }>
                <div
                    className = 'login-dialog'
                    ref = { this._setDialogElement }>
                    <Form onSubmit = { this._onSubmit }>
                        {({ formProps, submitting }) => (
                            <form { ...formProps }>
                                <Field
                                    defaultValue = ''
                                    isRequired = { true }
                                    label = { t('dialog.username') }
                                    name = 'username'
                                    validate = { this.validateUsername }>
                                    {({ fieldProps, error }) => (
                                        <Fragment>
                                            <TextField
                                                autoComplete = 'off'
                                                { ...fieldProps } />
                                            { !error && (
                                                <HelperMessage>
                                                    { t('dialog.usernameMsg') }
                                                </HelperMessage>
                                            )}
                                            { error && (
                                                <ErrorMessage>
                                                    { t('dialog.usernameErrTooShort') }
                                                </ErrorMessage>
                                            )}
                                        </Fragment>
                                    )}
                                </Field>
                                <Field
                                    defaultValue = ''
                                    isRequired = { true }
                                    label = { t('dialog.password') }
                                    name = 'password'
                                    validate = { this.validatePassword }>
                                    {({ fieldProps, error, valid, meta }) => (
                                        <Fragment>
                                            <TextField
                                                { ...fieldProps }
                                                type = 'password' />
                                            { !error && (
                                                <HelperMessage>
                                                    { t('dialog.passwordMsg') }
                                                </HelperMessage>
                                            )}
                                            { error && (
                                                <ErrorMessage>
                                                    { t('dialog.passwordErr') }
                                                </ErrorMessage>
                                            )}
                                            { valid && meta.dirty ? (
                                                <ValidMessage>
                                                    { t('dialog.passwordValid') }
                                                </ValidMessage>
                                            ) : null }
                                        </Fragment>
                                    )}
                                </Field>
                                <CheckboxField
                                    defaultIsChecked = { true }
                                    name = 'remember'>
                                    {({ fieldProps }) => (
                                        <Checkbox
                                            { ...fieldProps }
                                            label = { t('dialog.rememberMe') } />
                                    )}
                                </CheckboxField>
                                <FormFooter>
                                    <ButtonGroup>
                                        <Button
                                            appearance = 'subtle'
                                            onClick = { this._onCancel }>
                                            { t('dialog.Cancel') }
                                        </Button>
                                        <Button
                                            appearance = 'primary'
                                            isLoading = { submitting }
                                            type = 'submit'>
                                            { t('dialog.login') }
                                        </Button>
                                    </ButtonGroup>
                                </FormFooter>
                            </form>
                        )}
                    </Form>
                </div>
            </Modal>
        );
    }

    _onDialogDismissed: () => void;

    /**
      * Handles click on the blanket area.
      *
      * @returns {void}
      */
    _onDialogDismissed() {
        this._onCancel();
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
}

LoginDialog_ = translate(connect()(LoginDialog));

export default LoginDialog_;
