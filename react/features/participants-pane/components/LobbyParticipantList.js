// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { withPixelLineHeight } from '../../base/styles/functions.web';
import { admitMultiple } from '../../lobby/actions.web';
import { getLobbyState } from '../../lobby/functions';

import { LobbyParticipantItem } from './LobbyParticipantItem';

const useStyles = makeStyles(theme => {
    return {
        headingContainer: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
        },
        heading: {
            ...withPixelLineHeight(theme.typography.heading7),
            color: theme.palette.text02
        },
        link: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.link01,
            cursor: 'pointer'
        }
    };
});


export const LobbyParticipantList = () => {
    const {
        lobbyEnabled,
        knockingParticipants: participants
    } = useSelector(getLobbyState);
    const { t } = useTranslation();
    const classes = useStyles();
    const dispatch = useDispatch();
    const admitAll = useCallback(() => {
        dispatch(admitMultiple(participants));
    }, [ dispatch, participants ]);

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    return (
    <>
        <div className = { classes.headingContainer }>
            <div className = { classes.heading }>
                {t('participantsPane.headings.lobby', { count: participants.length })}
            </div>
            <div
                className = { classes.link }
                onClick = { admitAll }>{t('lobby.admitAll')}</div>
        </div>
        <div>
            {participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    participant = { p } />)
            )}
        </div>
    </>
    );
};
