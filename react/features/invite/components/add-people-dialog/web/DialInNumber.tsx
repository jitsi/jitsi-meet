import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import CopyButton from '../../../../base/buttons/CopyButton.web';
import Tooltip from '../../../../base/tooltip/components/Tooltip';
import { _formatConferenceIDPin } from '../../../_utils';

/**
 * The type of the React {@code Component} props of {@link DialInNumber}.
 */
interface IProps {

    /**
     * The numeric identifier for the current conference, used after dialing a
     * the number to join the conference.
     */
    conferenceID: string | number;

    /**
     * The phone number to dial to begin the process of dialing into a
     * conference.
     */
    phoneNumber: string;
}

/**
* If we want a copy button with only an icon on it and without text.
*/

const useStyles = makeStyles()(() => {
    return {
        copyButtonWithoutText: {
            width: '50px !important',
            height: '50px',
            background: 'transparent !important',

            '&:hover': {
                backgroundColor: 'transparent !important'
            }
        }
    };
});

/**
 * Component responsible for displaying a telephone number and
 * conference ID for dialing into a conference and copying them to clipboard.
 *
 * @returns {ReactNode}
 */
function DialInNumber({ conferenceID, phoneNumber }: IProps) {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dialInLabel = t('info.dialInNumber');
    const passcode = t('info.dialInConferenceID');
    const conferenceIDPin = `${_formatConferenceIDPin(conferenceID)}#`;
    const textToCopy = `${dialInLabel} ${phoneNumber} ${passcode} ${conferenceIDPin}`;

    return (
        <div className = 'dial-in-number'>
            <p>
                <span className = 'phone-number'>
                    <span className = 'info-label'>
                        { t('info.dialInNumber') }
                    </span>
                    <span className = 'spacer'>&nbsp;</span>
                    <span className = 'info-value'>
                        { phoneNumber }
                    </span>
                </span>
                <br />
                <span className = 'conference-id'>
                    <span className = 'info-label'>
                        { t('info.dialInConferenceID') }
                    </span>
                    <span className = 'spacer'>&nbsp;</span>
                    <span className = 'info-value'>
                        { `${_formatConferenceIDPin(conferenceID)}#` }
                    </span>
                </span>
            </p>
            <Tooltip
                content = { t('info.copyNumber') }
                position = 'top'>
                <CopyButton
                    accessibilityText = { t('info.copyNumber') }
                    className = { classes.copyButtonWithoutText }
                    hasSuccessNotification = { true }
                    hasText = { false }
                    id = 'add-people-copy-dial-in'
                    textToCopy = { textToCopy } />
            </Tooltip>
        </div>
    );
}

export default DialInNumber;
