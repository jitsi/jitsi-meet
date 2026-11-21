/* eslint-disable react/no-multi-comp */
import React, { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

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

interface IItemData {
    isInBreakoutRoom: boolean;
    lowerMenu: Function;
    openDrawerForParticipant: Function;
    overflowDrawer?: boolean;
    participantActionEllipsisLabel: string;
    participantIds: Array<string>;
    raiseContextId?: string;
    searchString?: string;
    toggleMenu: Function;
    youText: string;
}

const listStyles = {
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const
};

const InnerListElement = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div
        { ...props }
        ref = { ref }
        role = 'list' />
));

InnerListElement.displayName = 'MeetingParticipantInnerList';

const Row = React.memo(({ index, style, data }: ListChildComponentProps<IItemData>) => {
    const {
        isInBreakoutRoom,
        lowerMenu,
        openDrawerForParticipant,
        overflowDrawer,
        participantActionEllipsisLabel,
        participantIds,
        raiseContextId,
        searchString,
        toggleMenu,
        youText
    } = data;
    const id = participantIds[index];

    return (
        <div
            role = 'presentation'
            style = { style }>
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
});

Row.displayName = 'MeetingParticipantRow';

/**
 * Component used to display a list of meeting participants.
 *
 * @returns {ReactNode}
 */
function MeetingParticipantItems({
    isInBreakoutRoom,
    lowerMenu,
    toggleMenu,
    participantIds = [],
    openDrawerForParticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
    searchString,
    youText
}: IProps) {
    const itemData = useMemo(() => ({
        isInBreakoutRoom,
        lowerMenu,
        openDrawerForParticipant,
        overflowDrawer,
        participantActionEllipsisLabel,
        participantIds,
        raiseContextId,
        searchString,
        toggleMenu,
        youText
    }), [
        isInBreakoutRoom,
        lowerMenu,
        openDrawerForParticipant,
        overflowDrawer,
        participantActionEllipsisLabel,
        participantIds,
        raiseContextId,
        searchString,
        toggleMenu,
        youText
    ]);

    const itemKey = useCallback((index: number, data: IItemData) => data.participantIds[index], []);

    const onScroll = useCallback(() => {
        if (raiseContextId) {
            lowerMenu(true);
        }
    }, [ lowerMenu, raiseContextId ]);

    if (!participantIds.length) {
        return null;
    }

    // ListItem height is 56px on desktop (including padding), 72px on mobile/drawer mode.
    const itemSize = overflowDrawer ? 72 : 56;

    return (
        <AutoSizer>
            {({ height, width }) => {
                const contentHeight = participantIds.length * itemSize;
                const listHeight = Math.max(height, Math.min(200, contentHeight));

                return (
                    <FixedSizeList
                        height = { listHeight }
                        innerElementType = { InnerListElement }
                        itemCount = { participantIds.length }
                        itemData = { itemData }
                        itemKey = { itemKey }
                        itemSize = { itemSize }
                        onScroll = { onScroll }
                        style = { listStyles }
                        width = { width }>
                        { Row }
                    </FixedSizeList>
                );
            }}
        </AutoSizer>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<IProps>(MeetingParticipantItems);
