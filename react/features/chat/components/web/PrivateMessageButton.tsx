import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { CHAT_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { IconReply } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { handleLobbyChatInitialized, openChat } from '../../actions.web';

export interface IProps {

    /**
    * True if the message is a lobby chat message.
    */
    isLobbyMessage: boolean;

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantID: string;

    /**
     * Whether the button should be visible or not.
     */
    visible?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        replyButton: {
            padding: '2px',

            '&:hover': {
                backgroundColor: theme.palette.action03
            }
        }
    };
});

const PrivateMessageButton = ({ participantID, isLobbyMessage, visible }: IProps) => {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const participant = useSelector((state: IReduxState) => getParticipantById(state, participantID));
    const isVisible = useSelector((state: IReduxState) => getFeatureFlag(state, CHAT_ENABLED, true)) ?? visible;
    const { t } = useTranslation();

    const handleClick = useCallback(() => {
        if (isLobbyMessage) {
            dispatch(handleLobbyChatInitialized(participantID));
        } else {
            dispatch(openChat(participant));
        }
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <Button
            accessibilityLabel = { t('toolbar.accessibilityLabel.privateMessage') }
            className = { classes.replyButton }
            icon = { IconReply }
            onClick = { handleClick }
            type = { BUTTON_TYPES.TERTIARY } />
    );
};

export default PrivateMessageButton;
