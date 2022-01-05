// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconArrowLeft } from '../../../base/icons';
import { ActionButton } from '../../../base/premeeting';
import { getCountryCodeFromPhone } from '../../utils';
import Label from '../Label';

type Props = {

    /**
     * The number to call in order to join the conference.
     */
    number: string,

    /**
     * Handler used when clicking the back button.
     */
    onBack: Function,

    /**
     * Click handler for the text button.
     */
    onTextButtonClick: Function,

    /**
     * Click handler for primary button.
     */
    onPrimaryButtonClick: Function,

    /**
     * Click handler for the small additional text.
     */
    onSmallTextClick: Function,

    /**
     * The passCode of the conference.
     */
    passCode: string,

    /**
     * Used for translation.
     */
    t: Function,
};

/**
 * This component displays the dialog with all the information
 * to join a meeting by calling it.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element}
 */
function DialinDialog(props: Props) {
    const {
        number,
        onBack,
        onPrimaryButtonClick,
        onSmallTextClick,
        onTextButtonClick,
        passCode,
        t
    } = props;
    const flagClassName = `prejoin-dialog-flag iti-flag ${getCountryCodeFromPhone(
        number
    )}`;

    return (
        <div className = 'prejoin-dialog-dialin'>
            <div className = 'prejoin-dialog-dialin-header'>
                <Icon
                    className = 'prejoin-dialog-icon prejoin-dialog-dialin-icon'
                    onClick = { onBack }
                    role = 'button'
                    size = { 24 }
                    src = { IconArrowLeft } />
                <div className = 'prejoin-dialog-title'>
                    {t('prejoin.dialInMeeting')}
                </div>
            </div>
            <Label number = { 1 }>{ t('prejoin.dialInPin') }</Label>

            <div className = 'prejoin-dialog-dialin-num-container'>
                <div className = 'prejoin-dialog-dialin-num'>
                    <div className = { flagClassName } />
                    <span>{number}</span>
                </div>
                <div className = 'prejoin-dialog-dialin-num'>{passCode}</div>
            </div>
            <div>
                <span
                    className = 'prejoin-dialog-dialin-link'
                    onClick = { onSmallTextClick }>
                    {t('prejoin.viewAllNumbers')}
                </span>
            </div>
            <div className = 'prejoin-dialog-delimiter' />
            <Label
                className = 'prejoin-dialog-dialin-spaced-label'
                number = { 2 }>
                {t('prejoin.connectedWithAudioQ')}
            </Label>
            <div className = 'prejoin-dialog-dialin-btns'>
                <ActionButton
                    className = 'prejoin-dialog-btn'
                    onClick = { onPrimaryButtonClick }
                    type = 'primary'>
                    {t('prejoin.joinMeeting')}
                </ActionButton>
                <ActionButton
                    className = 'prejoin-dialog-btn'
                    onClick = { onTextButtonClick }
                    type = 'text'>
                    {t('dialog.Cancel')}
                </ActionButton>
            </div>
        </div>
    );
}

export default translate(DialinDialog);
