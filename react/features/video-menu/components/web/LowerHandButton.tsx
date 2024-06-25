import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IJitsiConference } from '../../../base/conference/reducer';
import { IconRaiseHand } from '../../../base/icons/svg';
import { raiseHand } from '../../../base/participants/actions';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { LOWER_HAND } from '../../../base/tracks/constants';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import logger from '../../logger';
import { IButtonProps } from '../../types';

interface IProps extends IButtonProps {
    conference: IJitsiConference | undefined;
}

/**
 * Implements a React {@link Component} which displays a button for notifying certain
 * participant who raised hand to lower hand.
 *
 * @returns {JSX.Element}
 */
const LowerHandButton = ({
    conference,
    participantID
}: IProps): JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const localParticipant = useSelector(getLocalParticipant);
    const _isModerator = Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR);

    const handleClick = useCallback(() => {
        try {
            if (!participantID) {
                dispatch(raiseHand(false));
            }
            conference?.sendEndpointMessage(
                participantID,
                {
                    name: LOWER_HAND,
                    isModerator: _isModerator
                }
            );

        } catch (error) {
            logger.error('Error in lower hand:', error.message);
        }
    }, [ participantID ]);

    return (
        <React.Fragment>
            {
                _isModerator ? <ContextMenuItem
                    accessibilityLabel = {
                        participantID
                            ? t('participantsPane.actions.lowerHand')
                            : t('participantsPane.actions.lowerAllHands') }
                    icon = { IconRaiseHand }
                    onClick = { handleClick }
                    text = {
                        participantID
                            ? t('participantsPane.actions.lowerHand')
                            : t('participantsPane.actions.lowerAllHands') } />
                    : null
            }
        </React.Fragment>
    );
};

export default LowerHandButton;
