import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Input from '../../../../base/ui/components/web/Input';
import { LOCKED_LOCALLY } from '../../../../room-lock/constants';

/**
 * The type of the React {@code Component} props of {@link PasswordForm}.
 */
interface IProps {

    /**
     * Whether or not to show the password editing field.
     */
    editEnabled: boolean;

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    locked?: string;

    /**
     * Callback to invoke when the local participant is submitting a password
     * set request.
     */
    onSubmit: Function;

    /**
     * The current known password for the JitsiConference.
     */
    password?: string;

    /**
     * The number of digits to be used in the password.
     */
    passwordNumberOfDigits?: number;

    /**
     * Whether or not the password should be visible.
     */
    visible: boolean;
}

/**
 * React {@code Component} for displaying and editing the conference password.
 *
 * @returns {ReactElement}
 */
export default function PasswordForm({
    editEnabled,
    locked,
    onSubmit,
    password,
    passwordNumberOfDigits,
    visible
}: IProps) {
    const { t } = useTranslation();
    const [ enteredPassword, setEnteredPassword ] = useState('');
    const onKeyPress = useCallback(event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            onSubmit(enteredPassword);
        }
    }, [ onSubmit, enteredPassword ]);

    if (!editEnabled && enteredPassword && enteredPassword !== '') {
        setEnteredPassword('');
    }

    const placeHolderText
        = passwordNumberOfDigits ? t('passwordDigitsOnly', { number: passwordNumberOfDigits }) : t('dialog.password');


    return (
        <div className = 'info-password'>
            { locked && <>
                <span className = 'info-label'>
                    {t('info.password')}
                </span>
                <span className = 'spacer'>&nbsp;</span>
                <span className = 'info-password-field info-value'>
                    {locked === LOCKED_LOCALLY ? (
                        <div className = 'info-password-local'>
                            { visible ? password : '******' }
                        </div>
                    ) : (
                        <div className = 'info-password-remote'>
                            { t('passwordSetRemotely') }
                        </div>
                    ) }
                </span>
            </>
            }
            {
                editEnabled && <div
                    className = 'info-password-form'>
                    <Input
                        accessibilityLabel = { t('info.addPassword') }
                        autoFocus = { true }
                        id = 'info-password-input'
                        maxLength = { passwordNumberOfDigits }
                        mode = { passwordNumberOfDigits ? 'numeric' : undefined }
                        onChange = { setEnteredPassword }
                        onKeyPress = { onKeyPress }
                        placeholder = { placeHolderText }
                        type = 'password'
                        value = { enteredPassword } />
                </div>
            }
        </div>
    );
}
