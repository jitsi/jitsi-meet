import React, { useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconCheck, IconCopy } from '../../../../base/icons/svg';
import Tooltip from '../../../../base/tooltip/components/Tooltip';
import { copyText } from '../../../../base/util/copyText.web';
import { showSuccessNotification } from '../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../notifications/constants';
import { _formatConferenceIDPin } from '../../../_utils';

let mounted: boolean;

/**
 * The type of the React {@code Component} props of {@link DialInNumber}.
 */
interface IProps extends WithTranslation {

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
 * Component responsible for displaying a telephone number and
 * conference ID for dialing into a conference and copying them to clipboard.
 *
 * @returns {ReactNode}
 */
function DialInNumber({ conferenceID, phoneNumber, t }: IProps) {
    const dispatch = useDispatch();
    const [ isClicked, setIsClicked ] = useState(false);
    const dialInLabel = t('info.dialInNumber');
    const passcode = t('info.dialInConferenceID');
    const conferenceIDPin = `${_formatConferenceIDPin(conferenceID)}#`;
    const textToCopy = `${dialInLabel} ${phoneNumber} ${passcode} ${conferenceIDPin}`;


    useEffect(() => {
        mounted = true;

        return () => {
            mounted = false;
        };
    }, []);

    /**
     * Copies the conference ID and phone number to the clipboard.
     *
     * @returns {void}
    */
    function _onCopyText() {
        copyText(textToCopy);
        dispatch(showSuccessNotification({
            titleKey: 'dialog.copied'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
        setIsClicked(true);
        setTimeout(() => {
            // avoid: Can't perform a React state update on an unmounted component
            if (mounted) {
                setIsClicked(false);
            }
        }, 2500);

    }

    /**
     * Copies the conference invitation to the clipboard.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    function _onCopyTextKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            _onCopyText();
        }
    }

    /**
     * Renders section that shows the phone number and conference ID
     * and give user the ability to copy them to the clipboard.
     *
     * @returns {ReactNode}
     */
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
                <button
                    aria-label = { t('info.copyNumber') }
                    className = 'dial-in-copy invisible-button'
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick = { _onCopyText }
                    // eslint-disable-next-line react/jsx-no-bind
                    onKeyPress = { _onCopyTextKeyPress }>
                    <Icon src = { isClicked ? IconCheck : IconCopy } />
                </button>
            </Tooltip>
        </div>
    );
}

export default translate(DialInNumber);
