// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import Label from '../Label';

type Props = {

    /**
     * The phone number that is being called.
     */
    number: string,

    /**
     * Closes the dialog.
     */
    onClose: Function,

    /**
     * Handler used on hangup click.
     */
    onHangup: Function,

    /**
     * The status of the call.
     */
    status: string,

    /**
     * Used for translation.
     */
    t: Function,
};

const useStyles = makeStyles(theme => {
    return {
        callingDialog: {
            padding: theme.spacing(3),
            textAlign: 'center',

            '& .prejoin-dialog-calling-header': {
                textAlign: 'right'
            },

            '& .prejoin-dialog-calling-label': {
                fontSize: '15px',
                margin: `${theme.spacing(2)}px 0 ${theme.spacing(3)}px 0`
            },

            '& .prejoin-dialog-calling-number': {
                fontSize: '19px',
                lineHeight: '28px',
                margin: `${theme.spacing(3)}px 0`
            }
        }
    };
});

/**
 * Dialog displayed when the user gets called by the meeting.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function CallingDialog(props: Props) {
    const { number, onClose, status, t } = props;
    const classes = useStyles();

    return (
        <div className = { classes.callingDialog }>
            <div className = 'prejoin-dialog-calling-header'>
                <Icon
                    className = 'prejoin-dialog-icon'
                    onClick = { onClose }
                    role = 'button'
                    size = { 24 }
                    src = { IconClose } />
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
