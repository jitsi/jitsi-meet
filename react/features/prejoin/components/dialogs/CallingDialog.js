// @flow

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

/**
 * Dialog displayed when the user gets called by the meeting.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function CallingDialog(props: Props) {
    const { number, onClose, status, t } = props;

    return (
        <div className = 'prejoin-dialog-calling'>
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
