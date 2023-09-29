/* eslint-disable react/jsx-no-bind */
import React, { useRef, useState } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import { copyText } from '../../../../base/util/copyText.web';
import { LOCKED_LOCALLY } from '../../../../room-lock/constants';
import { NOTIFY_CLICK_MODE } from '../../../../toolbox/constants';

import PasswordForm from './PasswordForm';
import { INotifyClick } from './SecurityDialog';

const DIGITS_ONLY = /^\d+$/;
const KEY = 'add-passcode';

interface IProps extends WithTranslation {

    /**
     * Toolbar buttons which have their click exposed through the API.
     */
    buttonsWithNotifyClick: Array<string | INotifyClick>;

    /**
     * Whether or not the current user can modify the current password.
     */
    canEditPassword: boolean;

    /**
     * The JitsiConference for which to display a lock state and change the
     * password.
     */
    conference: any;

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    locked?: string;

    /**
     * The current known password for the JitsiConference.
     */
    password?: string;

    /**
     * Whether or not to show the password in editing mode.
     */
    passwordEditEnabled: boolean;

    /**
     * The number of digits to be used in the password.
     */
    passwordNumberOfDigits?: number;

    /**
     * Action that sets the conference password.
     */
    setPassword: Function;

    /**
     * Method that sets whether the password editing is enabled or not.
     */
    setPasswordEditEnabled: Function;
}

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
    t }: IProps) {

    const formRef = useRef<HTMLDivElement>(null);
    const [ passwordVisible, setPasswordVisible ] = useState(false);

    /**
     * Callback invoked to set a password on the current JitsiConference.
     *
     * @param {string} enteredPassword - The new password to be used to lock the
     * current JitsiConference.
     * @private
     * @returns {void}
     */
    function onPasswordSubmit(enteredPassword: string) {
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
            (btn: string | INotifyClick) =>
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
            // @ts-ignore
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
        copyText(password ?? '');
    }

    /**
     * Callback invoked to show the current password.
     *
     * @returns {void}
     */
    function onPasswordShow() {
        setPasswordVisible(true);
    }

    /**
     * Callback invoked to hide the current password.
     *
     * @returns {void}
     */
    function onPasswordHide() {
        setPasswordVisible(false);
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
                    <button
                        className = 'as-link'
                        onClick = { onTogglePasswordEditState }
                        type = 'button'>
                        { t('dialog.Cancel') }
                        <span className = 'sr-only'>({ t('dialog.password') })</span>
                    </button>
                    <button
                        className = 'as-link'
                        onClick = { onPasswordSave }
                        type = 'button'>
                        { t('dialog.add') }
                        <span className = 'sr-only'>({ t('dialog.password') })</span>
                    </button>
                </>
            );
        }

        if (locked) {
            return (
                <>
                    <button
                        className = 'remove-password as-link'
                        onClick = { onPasswordRemove }
                        type = 'button'>
                        { t('dialog.Remove') }
                        <span className = 'sr-only'>({ t('dialog.password') })</span>
                    </button>
                    {

                        // There are cases like lobby and grant moderator when password is not available
                        password ? <>
                            <button
                                className = 'copy-password as-link'
                                onClick = { onPasswordCopy }
                                type = 'button'>
                                { t('dialog.copy') }
                                <span className = 'sr-only'>({ t('dialog.password') })</span>
                            </button>
                        </> : null
                    }
                    {locked === LOCKED_LOCALLY && (
                        <button
                            className = 'as-link'
                            onClick = { passwordVisible ? onPasswordHide : onPasswordShow }
                            type = 'button'>
                            {t(passwordVisible ? 'dialog.hide' : 'dialog.show')}
                            <span className = 'sr-only'>({ t('dialog.password') })</span>
                        </button>
                    )}
                </>
            );
        }

        return (
            <button
                className = 'add-password as-link'
                onClick = { onTogglePasswordEditState }
                type = 'button'>{ t('info.addPassword') }</button>
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
                        passwordNumberOfDigits = { passwordNumberOfDigits }
                        visible = { passwordVisible } />
                </div>
                <div className = 'security-dialog password-actions'>
                    { renderPasswordActions() }
                </div>
            </div>
        </div>
    );
}

export default translate(PasswordSection);
