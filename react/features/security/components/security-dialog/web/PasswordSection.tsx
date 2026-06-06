/* eslint-disable react/jsx-no-bind */
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { setPassword } from '../../../../base/conference/actions';
import { isLocalParticipantModerator } from '../../../../base/participants/functions';
import { copyText } from '../../../../base/util/copyText.web';
import { LOCKED_LOCALLY } from '../../../../room-lock/constants';
import { NOTIFY_CLICK_MODE } from '../../../../toolbox/types';

import PasswordForm from './PasswordForm';

const DIGITS_ONLY = /^\d+$/;
const KEY = 'add-passcode';

/**
 * Component that handles the password manipulation from the invite dialog.
 *
 * @returns {React$Element<any>}
 */
function PasswordSection() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const canEditPassword = useSelector(isLocalParticipantModerator);
    const passwordNumberOfDigits = useSelector(
        (state: IReduxState) => state['features/base/config'].roomPasswordNumberOfDigits);
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const locked = useSelector((state: IReduxState) => state['features/base/conference'].locked);
    const password = useSelector((state: IReduxState) => state['features/base/conference'].password);
    const formRef = useRef<HTMLDivElement>(null);
    const [ passwordVisible, setPasswordVisible ] = useState(false);
    const buttonsWithNotifyClick = useSelector(
        (state: IReduxState) => state['features/toolbox'].buttonsWithNotifyClick);
    const [ passwordEditEnabled, setPasswordEditEnabled ] = useState(false);

    if (passwordEditEnabled && (password || locked)) {
        setPasswordEditEnabled(false);
    }

    const onPasswordSubmit = useCallback((enteredPassword: string) => {
        if (enteredPassword && passwordNumberOfDigits && !DIGITS_ONLY.test(enteredPassword)) {
            // Don't set the password.
            return;
        }
        dispatch(setPassword(conference, conference?.lock, enteredPassword));
    }, [ dispatch, passwordNumberOfDigits, conference?.lock ]);

    const onTogglePasswordEditState = useCallback(() => {
        if (typeof APP === 'undefined' || !buttonsWithNotifyClick?.size) {
            setPasswordEditEnabled(!passwordEditEnabled);

            return;
        }

        const notifyMode = buttonsWithNotifyClick?.get(KEY);

        if (notifyMode) {
            APP.API.notifyToolbarButtonClicked(
                KEY, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }

        if (!notifyMode || notifyMode === NOTIFY_CLICK_MODE.ONLY_NOTIFY) {
            setPasswordEditEnabled(!passwordEditEnabled);
        }
    }, [ buttonsWithNotifyClick, setPasswordEditEnabled, passwordEditEnabled ]);

    const onPasswordSave = useCallback(() => {
        if (formRef.current) {
            // @ts-ignore
            const { value } = formRef.current.querySelector('div > input');

            if (value) {
                onPasswordSubmit(value);
            }
        }
    }, [ formRef.current, onPasswordSubmit ]);

    const onPasswordRemove = useCallback(() => {
        onPasswordSubmit('');
    }, [ onPasswordSubmit ]);


    const onPasswordCopy = useCallback(() => {
        copyText(password ?? '');
    }, [ password ]);

    const onPasswordShow = useCallback(() => {
        setPasswordVisible(true);
    }, [ setPasswordVisible ]);

    const onPasswordHide = useCallback(() => {
        setPasswordVisible(false);
    }, [ setPasswordVisible ]);

    let actions = null;

    if (canEditPassword) {
        if (passwordEditEnabled) {
            actions = (
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
        } else if (locked) {
            actions = (
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
        } else {
            actions = (
                <button
                    className = 'add-password as-link'
                    onClick = { onTogglePasswordEditState }
                    type = 'button'>{ t('info.addPassword') }</button>
            );
        }
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
                    { actions }
                </div>
            </div>
        </div>
    );
}

export default PasswordSection;
