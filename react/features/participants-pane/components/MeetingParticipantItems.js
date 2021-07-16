// @flow

import React from 'react';

import MeetingParticipantItem from './MeetingParticipantItem';

type Props = {

    /**
     * The translated ask unmute text for the qiuck action buttons.
     */
    askUnmuteText: string,

    /**
     * Reference to the local paraticipant.
     */
    localParticipant: Object,

    /**
     * Callback for the mouse leaving this item
     */
    lowerMenu: Function,

    /**
     * Callback for the activation of this item's context menu
     */
    toggleMenu: Function,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * The translated text for the mute participant button.
     */
    muteParticipantButtonText: string,

    /**
     * The meeting participants.
     */
    participants: Array<Object>,

    /**
     * Callback used to open an actions drawer for a participant.
     */
    openDrawerForPaticipant: Function,

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * The if of the participant for which the context menu should be open.
     */
    raiseContextId?: string,

    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string,

    /**
     * The translated "you" text.
     */
    youText: string
}

/**
 * Component used to display a list of meeting participants.
 *
 * @returns {ReactNode}
 */
function MeetingParticipantItems({
    askUnmuteText,
    localParticipant,
    lowerMenu,
    toggleMenu,
    muteAudio,
    muteParticipantButtonText,
    participants,
    openDrawerForPaticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
    youText
}) {
    const renderParticipant = id => (
        <MeetingParticipantItem
            askUnmuteText = { askUnmuteText }
            isHighlighted = { raiseContextId === id }
            key = { id }
            muteAudio = { muteAudio }
            muteParticipantButtonText = { muteParticipantButtonText }
            onContextMenu = { toggleMenu(id) }
            onLeave = { lowerMenu }
            openDrawerForPaticipant = { openDrawerForPaticipant }
            overflowDrawer = { overflowDrawer }
            participantActionEllipsisLabel = { participantActionEllipsisLabel }
            participantID = { id }
            youText = { youText } />
    );

    const items = [];

    localParticipant && items.push(renderParticipant(localParticipant?.id));
    participants.forEach(p => {
        items.push(renderParticipant(p?.id));
    });

    return items;
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<Props>(MeetingParticipantItems);
