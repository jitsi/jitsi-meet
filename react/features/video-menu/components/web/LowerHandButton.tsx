import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getCurrentConference } from '../../../base/conference/functions';
import { IconRaiseHand } from '../../../base/icons/svg';
import { raiseHand } from '../../../base/participants/actions';
import { LOWER_HAND_MESSAGE } from '../../../base/tracks/constants';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';

interface IProps {

    /**
     * The ID of the participant that's linked to the button.
     */
    participantID?: String;
}

/**
 * Implements a React {@link Component} which displays a button for notifying certain
 * participant who raised hand to lower hand.
 *
 * @returns {JSX.Element}
 */
const LowerHandButton = ({
    participantID = ''
}: IProps): JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentConference = useSelector(getCurrentConference);
    const accessibilityText = participantID
        ? t('participantsPane.actions.lowerHand')
        : t('participantsPane.actions.lowerAllHands');

    const handleClick = useCallback(() => {
        if (!participantID) {
            dispatch(raiseHand(false));
        }
        currentConference?.sendEndpointMessage(
            participantID,
            {
                name: LOWER_HAND_MESSAGE
            }
        );
    }, [ participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { accessibilityText }
            icon = { IconRaiseHand }
            onClick = { handleClick }
            text = { accessibilityText } />
    );
};

export default LowerHandButton;
