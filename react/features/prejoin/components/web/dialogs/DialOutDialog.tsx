import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../../base/icons/svg';
import Button from '../../../../base/ui/components/web/Button';
import Label from '../Label';
import CountryPicker from '../country-picker/CountryPicker';

interface IProps extends WithTranslation {

    /**
     * Closes a dialog.
     */
    onClose: (e?: React.MouseEvent) => void;

    /**
     * Submit handler.
     */
    onSubmit: Function;

    /**
     * Handler for text button.
     */
    onTextButtonClick: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        dialOutDialog: {
            padding: theme.spacing(3)
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: theme.spacing(4)
        },
        picker: {
            margin: `${theme.spacing(2)} 0 ${theme.spacing(3)} 0`
        }
    };
});

/**
 * This component displays the dialog from which the user can enter the
 * phone number in order to be called by the meeting.
 *
 * @param {IProps} props - The props of the component.
 * @returns {React$Element}
 */
function DialOutDialog(props: IProps) {
    const { onClose, onTextButtonClick, onSubmit, t } = props;
    const { classes } = useStyles();

    return (
        <div className = { classes.dialOutDialog }>
            <div className = { classes.header }>
                <div className = 'prejoin-dialog-title'>
                    {t('prejoin.startWithPhone')}
                </div>
                <Icon
                    className = 'prejoin-dialog-icon'
                    onClick = { onClose }
                    role = 'button'
                    size = { 24 }
                    src = { IconCloseLarge } />
            </div>
            <Label>{t('prejoin.callMeAtNumber')}</Label>
            <div className = { classes.picker }>
                <CountryPicker onSubmit = { onSubmit } />
            </div>
            <Button
                className = 'prejoin-dialog-btn'
                fullWidth = { true }
                labelKey = 'prejoin.callMe'
                onClick = { onSubmit }
                type = 'primary' />
            <div className = 'prejoin-dialog-delimiter-container'>
                <div className = 'prejoin-dialog-delimiter' />
                <div className = 'prejoin-dialog-delimiter-txt-container'>
                    <span className = 'prejoin-dialog-delimiter-txt'>
                        {t('prejoin.or')}
                    </span>
                </div>
            </div>
            <div className = 'prejoin-dialog-dialin-container'>
                <Button
                    className = 'prejoin-dialog-btn'
                    fullWidth = { true }
                    labelKey = 'prejoin.iWantToDialIn'
                    onClick = { onTextButtonClick }
                    type = 'tertiary' />
            </div>
        </div>
    );
}

export default translate(DialOutDialog);
