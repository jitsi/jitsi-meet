// @flow

import Textfield from '@atlaskit/textfield';
import React from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconAudioOnly, IconAudioOnlyOff } from '../../base/icons';
import { connect } from '../../base/redux';
import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link PasswordRequiredPrompt}.
 */
type PasswordRequiredPromptWebProps = {

    /**
     * The JitsiConference which requires a password.
     */
    conference: Object,

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * The translate function.
     */
    t: Function
};

// eslint-disable-next-line valid-jsdoc
/**
 * Implements a React Component which prompts the user when a password is
 * required to join a conference.
 */
function PasswordRequiredPrompt({ conference, dispatch, t }: PasswordRequiredPromptWebProps) {
    const [ password, setPassword ] = React.useState('');
    const [ passwordShown, setPasswordShown ] = React.useState(false);
    const [ cursorPosition, setCursorPosition ] = React.useState(0);
    const _onChange = React.useCallback(
        e => {
            setCursorPosition(e.target.selectionStart);
            setPassword(e.target.value);
        }, [ setPassword, setCursorPosition ]);

    /**
     * Dispatches action to cancel and dismiss this dialog.
     *
     * @private
     * @returns {boolean}
     */
    const _onCancel = React.useCallback(() => {
        dispatch(
            _cancelPasswordRequiredPrompt(conference));

        return true;
    }, [ dispatch, conference ]);

    const _onFocus = React.useCallback(e => {
        e.target.selectionStart = cursorPosition;
    }, [ cursorPosition ]);

    /**
     * Dispatches action to submit value from this dialog.
     *
     * @private
     * @returns {boolean}
     */
    const _onSubmit = React.useCallback(() => {

        // We received that password is required, but user is trying anyway to
        // login without a password. Mark the room as not locked in case she
        // succeeds (maybe someone removed the password meanwhile). If it is
        // still locked, another password required will be received and the room
        // again will be marked as locked.
        dispatch(
            setPassword(conference, conference.join, password));

        // We have used the password so let's clean it.
        setPassword(undefined);

        return true;
    }, [ dispatch, setPassword, conference, password ]);


    /**
     * Flips password visibility setting.
     *
     * @private
     * @returns {void}
     */
    const _onClickPasswordVisibility = React.useCallback(() => {
        setPasswordShown(!passwordShown);
    }, [ passwordShown, setPasswordShown ]);

    /**
     * Display component in dialog body.
     *
     * @returns {ReactElement}
     * @protected
     */
    const _renderBody = React.useCallback(() => {
        const eyeIcon = (<Icon
            alt = { passwordShown ? 'Show Password' : 'Hide Password' }
            className = 'textfield-icon'
            onClick = { _onClickPasswordVisibility }
            src = { passwordShown ? IconAudioOnlyOff : IconAudioOnly } />);

        console.log(cursorPosition);

        return (
            <Textfield
                elemAfterInput = { eyeIcon }
                label = { t('dialog.passwordLabel') }
                name = 'lockKey'
                onChange = { _onChange }
                onFocus = { _onFocus }
                type = { passwordShown ? 'text' : 'password' }
                value = { password } />
        );
    }, [ password, passwordShown ]);

    return (
        <Dialog
            disableBlanketClickDismiss = { true }
            isModal = { false }
            onCancel = { _onCancel }
            onSubmit = { _onSubmit }
            titleKey = 'dialog.passwordRequired'
            width = 'small'>
            { _renderBody() }
        </Dialog>
    );
}

export default translate(connect()(PasswordRequiredPrompt));
