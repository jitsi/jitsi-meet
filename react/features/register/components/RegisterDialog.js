/* eslint-disable no-confusing-arrow */
// @flow

import axios from 'axios';
import { isEmpty } from 'lodash';
import Form, {
    ErrorMessage,
    Field,
    FormFooter,
    HelperMessage,
    ValidMessage
} from '@atlaskit/form';
import Button, { ButtonGroup } from '@atlaskit/button';
import Modal from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import React, { Component, Fragment } from 'react';
import type { Dispatch } from 'redux';

import { hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { setCurrentUser } from '../../base/auth';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link RegisterDialog}.
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
let RegisterDialog_; // eslint-disable-line prefer-const

/**
 * The type of the React {@code Component} state of {@link LoginDialog}.
 */
type State = {
    errorCode: string,
    errorMessage: string
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class RegisterDialog extends Component<Props, State> {

    _dialogElement: ?HTMLElement;

    /**
     * Initializes a new RegisterDialog instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            errorCode: '',
            errorMessage: ''
        };

        this._onSubmit = this._onSubmit.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onDialogDismissed = this._onDialogDismissed.bind(this);
        this._setDialogElement = this._setDialogElement.bind(this);
        this.validateOnSubmit = this.validateOnSubmit.bind(this);
    }

    _onSubmit: (Object) => void;

    /**
     * Submit register data.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onSubmit(data) {
        const { dispatch } = this.props;
        const result = this.validateOnSubmit(data);

        console.log('form data', data);

        if (!isEmpty(result)) {
            return result;
        }

        this.setState({
            errorCode: '',
            errorMessage: ''
        });

        return axios.post('/auth/api/signup', data)
            .then(resp => {
                dispatch(setCurrentUser(resp.data));
                this._onCancel();
            })
            .catch(error => {
                this.setState({
                    errorCode: error?.response?.headers?.['www-authenticate'],
                    errorMessage: error.message
                });
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
        this.props.dispatch(hideDialog(RegisterDialog_));
    }

    validateOnSubmit: (Object) => Object;

    /**
     * Validates the form data.
     *
     * @param {Object} data - Form data.
     * @private
     * @returns {Object}
     */
    validateOnSubmit(data) {
        const { t } = this.props;
        const errors = {};

        // check email
        if (!data.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(data.email)) {
            errors.email = t('dialog.emailErrInvalid');
        }

        if (!data.name || data.name.length < 2) {
            errors.name = t('dialog.nameErrorTooShort');
        }

        // check username
        if (!data.username || data.username.length < 5) {
            errors.username = t('dialog.usernameErrTooShort');
        }

        // check password
        if (!data.password || data.password.length < 8) {
            errors.password = t('dialog.passwordErrTooShort');
        }

        return errors;
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
        const { errorCode, errorMessage } = this.state;

        return (
            <Modal
                autoFocus = { true }
                heading = { t('dialog.register') }
                i18n = { this.props.i18n }
                onClose = { this._onDialogDismissed }
                onDialogDismissed = { this._onDialogDismissed }
                shouldCloseOnEscapePress = { true }
                width = { 'small' }>
                <div
                    className = 'register-dialog'
                    ref = { this._setDialogElement }>
                    <Form onSubmit = { this._onSubmit }>
                        {({ formProps, submitting }) => (
                            <form { ...formProps }>
                                <Field
                                    defaultValue = ''
                                    isRequired = { true }
                                    label = { t('dialog.email') }
                                    name = 'email'>
                                    {({ fieldProps, error }) => (
                                        <Fragment>
                                            <TextField
                                                autoComplete = 'off'
                                                { ...fieldProps } />
                                            { error && <ErrorMessage>{ error }</ErrorMessage> }
                                            { errorCode === 'email_in_use' && (
                                                <ErrorMessage>
                                                    { t('dialog.emailErrInUse') }
                                                </ErrorMessage>
                                            )}
                                        </Fragment>
                                    )}
                                </Field>
                                <Field
                                    defaultValue = ''
                                    isRequired = { true }
                                    label = { t('dialog.name') }
                                    name = 'name'>
                                    {({ fieldProps }) => (
                                        <TextField
                                            autoComplete = 'off'
                                            { ...fieldProps } />
                                    )}
                                </Field>
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
                                            { error && <ErrorMessage>{ error }</ErrorMessage> }
                                            { errorCode === 'username_in_use' && (
                                                <ErrorMessage>
                                                    { t('dialog.usernameErrInUse') }
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
                                            { error && <ErrorMessage>{ error }</ErrorMessage> }
                                            { valid && meta.dirty ? (
                                                <ValidMessage>
                                                    { t('dialog.passwordValid') }
                                                </ValidMessage>
                                            ) : null }
                                            { !errorCode && errorMessage && (
                                                <ErrorMessage>
                                                    { errorMessage }
                                                </ErrorMessage>
                                            )}
                                        </Fragment>
                                    )}
                                </Field>
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
                                            { t('dialog.register') }
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

RegisterDialog_ = translate(connect()(RegisterDialog));

export default RegisterDialog_;
