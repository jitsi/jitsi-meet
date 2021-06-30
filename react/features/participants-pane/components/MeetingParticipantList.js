// @flow

import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { openDialog } from '../../base/dialog';
import {
    getRemoteParticipantCount,
    getRemoteParticipants
} from '../../base/participants';
import MuteRemoteParticipantDialog from '../../video-menu/components/web/MuteRemoteParticipantDialog';
import { findStyledAncestor, shouldRenderInviteButton } from '../functions';

import { InviteButton } from './InviteButton';
import { MeetingParticipantContextMenu } from './MeetingParticipantContextMenu';
import { MeetingParticipantItem } from './MeetingParticipantItem';
import { Heading, ParticipantContainer } from './styled';

type NullProto = {
  [key: string]: any,
  __proto__: null
};

type RaiseContext = NullProto | {

  /**
   * Target elements against which positioning calculations are made
   */
  offsetTarget?: HTMLElement,

  /**
   * Participant reference
   */
  participant?: Object,
};

const initialState = Object.freeze(Object.create(null));

export const MeetingParticipantList = () => {
    const dispatch = useDispatch();
    const isMouseOverMenu = useRef(false);
    const participants = useSelector(getRemoteParticipants);

    // This is very important as getRemoteParticipants is not changing its reference object
    // and we will not re-render on change, but if count changes we will do
    const participantsCount = useSelector(getRemoteParticipantCount);

    const showInviteButton = useSelector(shouldRenderInviteButton);
    const [ raiseContext, setRaiseContext ] = useState<RaiseContext>(initialState);
    const { t } = useTranslation();

    const lowerMenu = useCallback(() => {
        /**
         * We are tracking mouse movement over the active participant item and
         * the context menu. Due to the order of enter/leave events, we need to
         * defer checking if the mouse is over the context menu with
         * queueMicrotask
         */
        window.queueMicrotask(() => {
            if (isMouseOverMenu.current) {
                return;
            }

            if (raiseContext !== initialState) {
                setRaiseContext(initialState);
            }
        });
    }, [ raiseContext ]);

    const raiseMenu = useCallback((participant, target) => {
        setRaiseContext({
            participant,
            offsetTarget: findStyledAncestor(target, ParticipantContainer)
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback(participant => e => {
        const { participant: raisedParticipant } = raiseContext;

        if (raisedParticipant && raisedParticipant === participant) {
            lowerMenu();
        } else {
            raiseMenu(participant, e.target);
        }
    }, [ raiseContext ]);

    const menuEnter = useCallback(() => {
        isMouseOverMenu.current = true;
    }, []);

    const menuLeave = useCallback(() => {
        isMouseOverMenu.current = false;
        lowerMenu();
    }, [ lowerMenu ]);

    const muteAudio = useCallback(id => () => {
        dispatch(openDialog(MuteRemoteParticipantDialog, { participantID: id }));
    });

    const items = [];

    participants.forEach(p => {
        items.push(<MeetingParticipantItem
            isHighlighted = { raiseContext.participant === p }
            key = { p.id }
            muteAudio = { muteAudio }
            onContextMenu = { toggleMenu(p) }
            onLeave = { lowerMenu }
            participant = { p } />);
    });

    return (
    <>
        <Heading>{t('participantsPane.headings.participantsList', { count: participantsCount })}</Heading>
        {showInviteButton && <InviteButton />}
        <div>
            { items }
        </div>
        <MeetingParticipantContextMenu
            muteAudio = { muteAudio }
            onEnter = { menuEnter }
            onLeave = { menuLeave }
            onSelect = { lowerMenu }
            { ...raiseContext } />
    </>
    );
};
