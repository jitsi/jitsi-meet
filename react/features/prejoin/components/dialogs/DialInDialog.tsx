/* eslint-disable lines-around-comment */

import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowLeft } from '../../../base/icons/svg';
// @ts-ignore
import { ActionButton } from '../../../base/premeeting';
// @ts-ignore
import { getCountryCodeFromPhone } from '../../utils';
// @ts-ignore
import Label from '../Label';

interface Props extends WithTranslation {

    /**
     * The number to call in order to join the conference.
     */
    number: string;

    /**
     * Handler used when clicking the back button.
     */
    onBack: Function;

    /**
     * Click handler for primary button.
     */
    onPrimaryButtonClick: Function;

    /**
     * Click handler for the small additional text.
     */
    onSmallTextClick: (e?: React.MouseEvent) => void;

    /**
     * Click handler for the text button.
     */
    onTextButtonClick: (e?: React.MouseEvent) => void;

    /**
     * The passCode of the conference.
     */
    passCode: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        dialInDialog: {
            textAlign: 'center',

            '& .prejoin-dialog-dialin-header': {
                alignItems: 'center',
                margin: `${theme.spacing(3)} 0 ${theme.spacing(5)} ${theme.spacing(3)}`,
                display: 'flex'
            },
            '& .prejoin-dialog-dialin-icon': {
                marginRight: theme.spacing(3)
            },
            '& .prejoin-dialog-dialin-num': {
                background: '#3e474f',
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '15px',
                lineHeight: '24px',
                margin: theme.spacing(1),
                padding: theme.spacing(2),

                '& .prejoin-dialog-dialin-num-container': {
                    minHeight: '48px',
                    margin: `${theme.spacing(2)} 0`
                }
            },

            '& .prejoin-dialog-dialin-link': {
                color: '#6FB1EA',
                cursor: 'pointer',
                display: 'inline-block',
                fontSize: '13px',
                lineHeight: '20px',
                marginBottom: theme.spacing(4)
            },
            '& .prejoin-dialog-dialin-spaced-label': {
                marginBottom: theme.spacing(3),
                marginTop: '28px'
            },
            '& .prejoin-dialog-dialin-btns > div': {
                marginBottom: theme.spacing(3)
            }
        }
    };
});

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
    const { classes } = useStyles();
    const flagClassName = `prejoin-dialog-flag iti-flag ${getCountryCodeFromPhone(
        number
    )}`;

    return (
        <div className = { classes.dialInDialog }>
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
