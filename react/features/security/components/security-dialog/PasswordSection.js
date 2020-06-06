/* eslint-disable react/no-multi-comp */
// @flow

import React, { useRef } from 'react';

import { translate } from '../../../base/i18n';
import { copyText } from '../../../invite';

import PasswordForm from './PasswordForm';

type Props = {

    /**
     * Whether or not the current user can modify the current password.
     */
    canEditPassword: boolean,

    /**
     * The JitsiConference for which to display a lock state and change the
     * password.
     */
    conference: Object,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    locked: string,

    /**
     * The current known password for the JitsiConference.
     */
    password: string,

    /**
     * Whether or not to show the password in editing mode.
     */
    passwordEditEnabled: boolean,

    /**
     * The number of digits to be used in the password.
     */
    passwordNumberOfDigits: ?number,

    /**
     * Action that sets the conference password.
     */
    setPassword: Function,

    /**
     * Method that sets whether the password editing is enabled or not.
     */
    setPasswordEditEnabled: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component that handles the password manipulation from the invite dialog.
 *
 * @returns {React$Element<any>}
 */
function PasswordSection({
    canEditPassword,
    conference,
    locked,
    password,
    passwordEditEnabled,
    passwordNumberOfDigits,
    setPassword,
    setPasswordEditEnabled,
    t }: Props) {

    const formRef: Object = useRef(null);

    /**
     * Callback invoked to set a password on the current JitsiConference.
     *
     * @param {string} enteredPassword - The new password to be used to lock the
     * current JitsiConference.
     * @private
     * @returns {void}
     */
    function onPasswordSubmit(enteredPassword) {
        setPassword(conference, conference.lock, enteredPassword);
    }

    /**
     * Toggles whether or not the password should currently be shown as being
     * edited locally.
     *
     * @private
     * @returns {void}
     */
    function onTogglePasswordEditState() {
        setPasswordEditEnabled(!passwordEditEnabled);
    }

    /**
     * Method to remotely submit the password from outside of the password form.
     *
     * @returns {void}
     */
    function onPasswordSave() {
        if (formRef.current) {
            formRef.current.querySelector('form').requestSubmit();
        }
    }

    /**
     * Callback invoked to unlock the current JitsiConference.
     *
     * @returns {void}
     */
    function onPasswordRemove() {
        onPasswordSubmit('');
    }

    /**
     * Copies the password to the clipboard.
     *
     * @returns {void}
     */
    function onPasswordCopy() {
        copyText(password);
    }

    /**
     * Method that renders the password action(s) based on the current
     * locked-status of the conference.
     *
     * @returns {React$Element<any>}
     */
    function renderPasswordActions() {
        if (!canEditPassword) {
            return null;
        }

        if (passwordEditEnabled) {
            return (
                <>
                    <a onClick = { onTogglePasswordEditState }>{ t('dialog.Cancel') }</a>
                    <a onClick = { onPasswordSave }>{ t('dialog.add') }</a>
                </>
            );
        }

        if (locked) {
            return (
                <>
                    <a
                        className = 'remove-password'
                        onClick = { onPasswordRemove }>{ t('dialog.Remove') }</a>
                    <a
                        className = 'copy-password'
                        onClick = { onPasswordCopy }>{ t('dialog.copy') }</a>
                </>
            );
        }

        return (
            <a
                className = 'add-password'
                onClick = { onTogglePasswordEditState }>{ t('info.addPassword') }</a>
        );
    }

    return (
        <div className = 'security-dialog password'>
            <div
                className = 'info-dialog info-dialog-column info-dialog-password'
                ref = { formRef }>
                <PasswordForm
                    editEnabled = { passwordEditEnabled }
                    locked = { locked }
                    onSubmit = { onPasswordSubmit }
                    password = { password }
                    passwordNumberOfDigits = { passwordNumberOfDigits } />
            </div>
            <div className = 'security-dialog password-actions'>
                { renderPasswordActions() }
            </div>
        </div>
    );
}

export default translate(PasswordSection);
