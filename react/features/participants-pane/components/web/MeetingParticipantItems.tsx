import React from 'react';

import MeetingParticipantItem from './MeetingParticipantItem';

interface IProps {

    /**
     * The translated ask unmute text for the quick action buttons.
     */
    askUnmuteText?: string;

    /**
     * Whether or not the local participant is in a breakout room.
     */
    isInBreakoutRoom: boolean;

    /**
     * Callback for the mouse leaving this item.
     */
    lowerMenu: Function;

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function;

    /**
     * The translated text for the mute participant button.
     */
    muteParticipantButtonText?: string;

    /**
     * Callback used to open an actions drawer for a participant.
     */
    openDrawerForParticipant: Function;

    /**
     * True if an overflow drawer should be displayed.
     */
    overflowDrawer?: boolean;

    /**
     * The aria-label for the ellipsis action.
     */
    participantActionEllipsisLabel: string;

    /**
     * The meeting participants.
     */
    participantIds: Array<string>;

    /**
     * The if of the participant for which the context menu should be open.
     */
    raiseContextId?: string;

    /**
     * Current search string.
     */
    searchString?: string;

    /**
     * Callback used to stop a participant's video.
     */
    stopVideo: Function;

    /**
     * Callback for the activation of this item's context menu.
     */
    toggleMenu: Function;

    /**
     * The translated "you" text.
     */
    youText: string;
}

/**
 * Component used to display a list of meeting participants.
 *
 * @returns {ReactNode}
 */
function MeetingParticipantItems({
    isInBreakoutRoom,
    lowerMenu,
    toggleMenu,
    muteAudio,
    participantIds,
    openDrawerForParticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
    searchString,
    stopVideo,
    youText
}: IProps) {
    const renderParticipant = (id: string) => (
        <MeetingParticipantItem
            isHighlighted = { raiseContextId === id }
            isInBreakoutRoom = { isInBreakoutRoom }
            key = { id }
            muteAudio = { muteAudio }
            onContextMenu = { toggleMenu(id) }
            onLeave = { lowerMenu }
            openDrawerForParticipant = { openDrawerForParticipant }
            overflowDrawer = { overflowDrawer }
            participantActionEllipsisLabel = { participantActionEllipsisLabel }
            participantID = { id }
            searchString = { searchString }
            stopVideo = { stopVideo }
            youText = { youText } />
    );

    return (<>
        {participantIds.map(renderParticipant)}
    </>);
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<IProps>(MeetingParticipantItems);
