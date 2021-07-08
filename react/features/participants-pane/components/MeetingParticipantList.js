// @flow

import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { openDialog } from '../../base/dialog';
import {
    getLocalParticipant,
    getParticipantCountWithFake,
    getRemoteParticipants
} from '../../base/participants';
import MuteRemoteParticipantDialog from '../../video-menu/components/web/MuteRemoteParticipantDialog';
import { findStyledAncestor, shouldRenderInviteButton } from '../functions';

import { InviteButton } from './InviteButton';
import MeetingParticipantContextMenu from './MeetingParticipantContextMenu';
import MeetingParticipantItem from './MeetingParticipantItem';
import { Heading, ParticipantContainer } from './styled';

type NullProto = {
  [key: string]: any,
  __proto__: null
};

type RaiseContext = NullProto | {|

  /**
   * Target elements against which positioning calculations are made
   */
  offsetTarget?: HTMLElement,

  /**
   * The ID of the participant.
   */
  participantID?: String,
|};

const initialState = Object.freeze(Object.create(null));

/**
 * Renders the MeetingParticipantList component.
 *
 * @returns {ReactNode} - The component.
 */
export function MeetingParticipantList() {
    const dispatch = useDispatch();
    const isMouseOverMenu = useRef(false);
    const participants = useSelector(getRemoteParticipants);
    const localParticipant = useSelector(getLocalParticipant);

    // This is very important as getRemoteParticipants is not changing its reference object
    // and we will not re-render on change, but if count changes we will do
    const participantsCount = useSelector(getParticipantCountWithFake);

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

    const raiseMenu = useCallback((participantID, target) => {
        setRaiseContext({
            participantID,
            offsetTarget: findStyledAncestor(target, ParticipantContainer)
        });
    }, [ raiseContext ]);

    const toggleMenu = useCallback(participantID => e => {
        const { participantID: raisedParticipant } = raiseContext;

        if (raisedParticipant && raisedParticipant === participantID) {
            lowerMenu();
        } else {
            raiseMenu(participantID, e.target);
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

    // FIXME:
    // It seems that useTranslation is not very scallable. Unmount 500 components that have the useTranslation hook is
    // taking more than 10s. To workaround the issue we need to pass the texts as props. This is temporary and dirty
    // solution!!!
    // One potential proper fix would be to use react-window component in order to lower the number of components
    // mounted.
    const participantActionEllipsisLabel = t('MeetingParticipantItem.ParticipantActionEllipsis.options');
    const youText = t('chat.you');
    const askUnmuteText = t('participantsPane.actions.askUnmute');
    const muteParticipantButtonText = t('dialog.muteParticipantButton');

    const renderParticipant = id => (
        <MeetingParticipantItem
            askUnmuteText = { askUnmuteText }
            isHighlighted = { raiseContext.participantID === id }
            key = { id }
            muteAudio = { muteAudio }
            muteParticipantButtonText = { muteParticipantButtonText }
            onContextMenu = { toggleMenu(id) }
            onLeave = { lowerMenu }
            participantActionEllipsisLabel = { participantActionEllipsisLabel }
            participantID = { id }
            youText = { youText } />
    );

    const items = [];

    localParticipant && items.push(renderParticipant(localParticipant?.id));
    participants.forEach(p => {
        items.push(renderParticipant(p?.id));
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
}
