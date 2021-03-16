// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { ActionButton } from '../../../base/premeeting';
import Label from '../Label';
import CountryPicker from '../country-picker/CountryPicker';

type Props = {

    /**
     * Closes a dialog.
     */
    onClose: Function,

    /**
     * Submit handler.
     */
    onSubmit: Function,

    /**
     * Handler for text button.
     */
    onTextButtonClick: Function,

    /**
     * Used for translation.
     */
    t: Function,
};

/**
 * This component displays the dialog from which the user can enter the
 * phone number in order to be called by the meeting.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element}
 */
function DialOutDialog(props: Props) {
    const { onClose, onTextButtonClick, onSubmit, t } = props;

    return (
        <div className = 'prejoin-dialog-callout'>
            <div className = 'prejoin-dialog-callout-header'>
                <div className = 'prejoin-dialog-title'>
                    {t('prejoin.startWithPhone')}
                </div>
                <Icon
                    className = 'prejoin-dialog-icon'
                    onClick = { onClose }
                    size = { 24 }
                    src = { IconClose } />
            </div>
            <Label>{t('prejoin.callMeAtNumber')}</Label>
            <div className = 'prejoin-dialog-callout-picker'>
                <CountryPicker onSubmit = { onSubmit } />
            </div>
            <ActionButton
                className = 'prejoin-dialog-btn'
                onClick = { onSubmit }
                type = 'primary'>
                {t('prejoin.callMe')}
            </ActionButton>
            <div className = 'prejoin-dialog-delimiter-container'>
                <div className = 'prejoin-dialog-delimiter' />
                <div className = 'prejoin-dialog-delimiter-txt-container'>
                    <span className = 'prejoin-dialog-delimiter-txt'>
                        {t('prejoin.or')}
                    </span>
                </div>
            </div>
            <div className = 'prejoin-dialog-dialin-container'>
                <ActionButton
                    className = 'prejoin-dialog-btn'
                    onClick = { onTextButtonClick }
                    type = 'text'>
                    {t('prejoin.iWantToDialIn')}
                </ActionButton>
            </div>
        </div>
    );
}

export default translate(DialOutDialog);
