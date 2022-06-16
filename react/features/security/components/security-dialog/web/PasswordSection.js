// @flow

/* eslint-disable react/no-multi-comp, react/jsx-no-bind */

import React, { useRef } from 'react';

import { translate } from '../../../../base/i18n';
import { copyText } from '../../../../base/util';
import { NOTIFY_CLICK_MODE } from '../../../../toolbox/constants';

import PasswordForm from './PasswordForm';

const DIGITS_ONLY = /^\d+$/;
const KEY = 'add-passcode';

type Props = {

    /**
     * Toolbar buttons which have their click exposed through the API.
     */
     buttonsWithNotifyClick: Array<string | Object>,

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

declare var APP: Object;

/**
 * Component that handles the password manipulation from the invite dialog.
 *
 * @returns {React$Element<any>}
 */
function PasswordSection({
    buttonsWithNotifyClick,
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
        if (enteredPassword && passwordNumberOfDigits && !DIGITS_ONLY.test(enteredPassword)) {
            // Don't set the password.
            return;
        }
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
        if (typeof APP === 'undefined' || !buttonsWithNotifyClick?.length) {
            setPasswordEditEnabled(!passwordEditEnabled);

            return;
        }

        let notifyMode;
        const notify = buttonsWithNotifyClick.find(
            (btn: string | Object) =>
                (typeof btn === 'string' && btn === KEY)
                || (typeof btn === 'object' && btn.key === KEY)
        );

        if (notify) {
            notifyMode = typeof notify === 'string' || notify.preventExecution
                ? NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
                : NOTIFY_CLICK_MODE.ONLY_NOTIFY;
            APP.API.notifyToolbarButtonClicked(
                KEY, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }

        if (notifyMode === NOTIFY_CLICK_MODE.ONLY_NOTIFY) {
            setPasswordEditEnabled(!passwordEditEnabled);
        }
    }

    /**
     * Method to remotely submit the password from outside of the password form.
     *
     * @returns {void}
     */
    function onPasswordSave() {
        if (formRef.current) {
            const { value } = formRef.current.querySelector('div > input');

            if (value) {
                onPasswordSubmit(value);
            }
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
     * Toggles whether or not the password should currently be shown as being
     * edited locally.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    function onTogglePasswordEditStateKeyPressHandler(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onTogglePasswordEditState();
        }
    }

    /**
     * Method to remotely submit the password from outside of the password form.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    function onPasswordSaveKeyPressHandler(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onPasswordSave();
        }
    }

    /**
     * Callback invoked to unlock the current JitsiConference.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    function onPasswordRemoveKeyPressHandler(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onPasswordRemove();
        }
    }

    /**
     * Copies the password to the clipboard.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    function onPasswordCopyKeyPressHandler(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onPasswordCopy();
        }
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
                    <a
                        aria-label = { t('dialog.Cancel') }
                        onClick = { onTogglePasswordEditState }
                        onKeyPress = { onTogglePasswordEditStateKeyPressHandler }
                        role = 'button'
                        tabIndex = { 0 }>{ t('dialog.Cancel') }</a>
                    <a
                        aria-label = { t('dialog.add') }
                        onClick = { onPasswordSave }
                        onKeyPress = { onPasswordSaveKeyPressHandler }
                        role = 'button'
                        tabIndex = { 0 }>{ t('dialog.add') }</a>
                </>
            );
        }

        if (locked) {
            return (
                <>
                    <a
                        aria-label = { t('dialog.Remove') }
                        className = 'remove-password'
                        onClick = { onPasswordRemove }
                        onKeyPress = { onPasswordRemoveKeyPressHandler }
                        role = 'button'
                        tabIndex = { 0 }>{ t('dialog.Remove') }</a>
                    {

                        // There are cases like lobby and grant moderator when password is not available
                        password ? <>
                            <a
                                aria-label = { t('dialog.copy') }
                                className = 'copy-password'
                                onClick = { onPasswordCopy }
                                onKeyPress = { onPasswordCopyKeyPressHandler }
                                role = 'button'
                                tabIndex = { 0 }>{ t('dialog.copy') }</a>
                        </> : null
                    }
                </>
            );
        }

        return (
            <a
                aria-label = { t('info.addPassword') }
                className = 'add-password'
                onClick = { onTogglePasswordEditState }
                onKeyPress = { onTogglePasswordEditStateKeyPressHandler }
                role = 'button'
                tabIndex = { 0 }>{ t('info.addPassword') }</a>
        );
    }

    return (
        <div className = 'security-dialog password-section'>
            <p className = 'description'>
                { t(canEditPassword ? 'security.about' : 'security.aboutReadOnly') }
            </p>
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
        </div>
    );
}

export default translate(PasswordSection);
