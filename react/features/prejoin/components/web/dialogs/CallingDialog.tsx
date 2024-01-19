import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../../base/avatar/components/Avatar';
import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../../base/icons/svg';
import Label from '../Label';

interface IProps extends WithTranslation {

    /**
     * The phone number that is being called.
     */
    number: string;

    /**
     * Closes the dialog.
     */
    onClose: (e?: React.MouseEvent) => void;

    /**
     * The status of the call.
     */
    status: string;
}

const useStyles = makeStyles()(theme => {
    return {
        callingDialog: {
            padding: theme.spacing(3),
            textAlign: 'center',

            '& .prejoin-dialog-calling-header': {
                textAlign: 'right'
            },

            '& .prejoin-dialog-calling-label': {
                fontSize: '15px',
                margin: `${theme.spacing(2)} 0 ${theme.spacing(3)} 0`
            },

            '& .prejoin-dialog-calling-number': {
                fontSize: '19px',
                lineHeight: '28px',
                margin: `${theme.spacing(3)} 0`
            }
        }
    };
});

/**
 * Dialog displayed when the user gets called by the meeting.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
function CallingDialog(props: IProps) {
    const { number, onClose, status, t } = props;
    const { classes } = useStyles();

    return (
        <div className = { classes.callingDialog }>
            <div className = 'prejoin-dialog-calling-header'>
                <Icon
                    className = 'prejoin-dialog-icon'
                    onClick = { onClose }
                    role = 'button'
                    size = { 24 }
                    src = { IconCloseLarge } />
            </div>
            <Label className = 'prejoin-dialog-calling-label'>
                {t(status)}
            </Label>
            <Avatar size = { 72 } />
            <div className = 'prejoin-dialog-calling-number'>{number}</div>
        </div>
    );
}

export default translate(CallingDialog);
