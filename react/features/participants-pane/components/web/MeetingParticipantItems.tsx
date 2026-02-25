import React, { useCallback } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import MeetingParticipantItem from './MeetingParticipantItem';

/**
 * Height of a single participant item in pixels.
 * This must match the actual rendered height of MeetingParticipantItem for proper virtualization.
 */
const PARTICIPANT_ITEM_HEIGHT = 56;

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
     * Callback for the activation of this item's context menu.
     */
    toggleMenu: Function;

    /**
     * The translated "you" text.
     */
    youText: string;
}

/**
 * Component used to display a virtualized list of meeting participants.
 * Uses react-window for efficient rendering of large participant lists,
 * solving the performance issue where unmounting 500+ components with
 * useTranslation hook was taking 10+ seconds.
 *
 * @returns {ReactNode}
 */
function MeetingParticipantItems({
    isInBreakoutRoom,
    lowerMenu,
    toggleMenu,
    participantIds,
    openDrawerForParticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
    searchString,
    youText
}: IProps) {
    /**
     * Renders a single participant row for the virtualized list.
     */
    const Row = useCallback(({ index, style }: ListChildComponentProps) => {
        const id = participantIds[index];

        return (
            <div style = { style }>
                <MeetingParticipantItem
                    isHighlighted = { raiseContextId === id }
                    isInBreakoutRoom = { isInBreakoutRoom }
                    key = { id }
                    onContextMenu = { toggleMenu(id) }
                    onLeave = { lowerMenu }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participantActionEllipsisLabel = { participantActionEllipsisLabel }
                    participantID = { id }
                    searchString = { searchString }
                    youText = { youText } />
            </div>
        );
    }, [
        participantIds,
        raiseContextId,
        isInBreakoutRoom,
        toggleMenu,
        lowerMenu,
        openDrawerForParticipant,
        overflowDrawer,
        participantActionEllipsisLabel,
        searchString,
        youText
    ]);

    // Style to prevent horizontal scrollbar and enable vertical scrolling
    const listStyle = {
        overflowX: 'hidden' as const,
        overflowY: 'auto' as const
    };

    // For small lists (< 20 items), render without virtualization for simplicity
    if (participantIds.length < 20) {
        return (
            <>
                {participantIds.map(id => (
                    <MeetingParticipantItem
                        isHighlighted = { raiseContextId === id }
                        isInBreakoutRoom = { isInBreakoutRoom }
                        key = { id }
                        onContextMenu = { toggleMenu(id) }
                        onLeave = { lowerMenu }
                        openDrawerForParticipant = { openDrawerForParticipant }
                        overflowDrawer = { overflowDrawer }
                        participantActionEllipsisLabel = { participantActionEllipsisLabel }
                        participantID = { id }
                        searchString = { searchString }
                        youText = { youText } />
                ))}
            </>
        );
    }

    // For larger lists, use virtualization to improve performance
    return (
        <div style = {{ height: '100%', minHeight: '200px' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <FixedSizeList
                        height = { Math.max(height, 200) }
                        itemCount = { participantIds.length }
                        itemSize = { PARTICIPANT_ITEM_HEIGHT }
                        style = { listStyle }
                        width = { width }>
                        { Row }
                    </FixedSizeList>
                )}
            </AutoSizer>
        </div>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<IProps>(MeetingParticipantItems);
