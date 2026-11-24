/* eslint-disable react/no-multi-comp */
import React, { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';

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
     * Height of each participant row in pixels.
     */
    itemSize: number;

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
     * The id of the participant for which the context menu should be open.
     */
    raiseContextId?: string;

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
 * Data passed to each virtualized participant row via {@code react-window}.
 */
interface IItemData {

    /**
     * Whether or not the local participant is in a breakout room.
     */
    isInBreakoutRoom: boolean;

    /**
     * Callback for the mouse leaving an item.
     */
    lowerMenu: Function;

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
     * The meeting participant IDs.
     */
    participantIds: Array<string>;

    /**
     * The id of the participant for which the context menu should be open.
     */
    raiseContextId?: string;

    /**
     * Callback for the activation of an item's context menu.
     */
    toggleMenu: Function;

    /**
     * The translated "you" text.
     */
    youText: string;
}

/**
 * Inline styles for the virtualized list scroll container.
 */
const listStyles = {
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const
};

/**
 * Inner list element for {@code FixedSizeList} with {@code role="list"} for accessibility.
 */
const InnerListElement = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <div
        { ...props }
        ref = { ref }
        role = 'list' />
));

InnerListElement.displayName = 'MeetingParticipantInnerList';

/**
 * Renders a single virtualized participant row.
 *
 * @param {ListChildComponentProps<IItemData>} props - The row props provided by {@code react-window}.
 * @returns {ReactElement}
 */
const Row = React.memo(({ index, style, data }: ListChildComponentProps<IItemData>) => {
    const {
        isInBreakoutRoom,
        lowerMenu,
        openDrawerForParticipant,
        overflowDrawer,
        participantActionEllipsisLabel,
        participantIds,
        raiseContextId,
        toggleMenu,
        youText
    } = data;
    const id = participantIds[index];
    const rowStyle = {
        ...style,
        boxSizing: 'border-box' as const,
        padding: `0 ${participantsPaneTheme.panePadding}px`
    };

    return (
        <div
            aria-posinset = { index + 1 }
            aria-setsize = { participantIds.length }
            role = 'listitem'
            style = { rowStyle }>
            <MeetingParticipantItem
                isHighlighted = { raiseContextId === id }
                isInBreakoutRoom = { isInBreakoutRoom }
                onContextMenu = { toggleMenu(id) }
                onLeave = { lowerMenu }
                openDrawerForParticipant = { openDrawerForParticipant }
                overflowDrawer = { overflowDrawer }
                participantActionEllipsisLabel = { participantActionEllipsisLabel }
                participantID = { id }
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
    itemSize,
    lowerMenu,
    toggleMenu,
    participantIds = [],
    openDrawerForParticipant,
    overflowDrawer,
    raiseContextId,
    participantActionEllipsisLabel,
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
        toggleMenu,
        youText
    ]);

    /**
     * Returns a stable key for each participant row.
     *
     * @param {number} index - The index of the row.
     * @param {IItemData} data - The list item data.
     * @returns {string}
     */
    const itemKey = useCallback((index: number, data: IItemData) => data.participantIds[index], []);

    /**
     * Closes the context menu when scrolling the list.
     *
     * @returns {void}
     */
    const onScroll = useCallback(() => {
        if (raiseContextId) {
            lowerMenu(true);
        }
    }, [ lowerMenu, raiseContextId ]);

    if (!participantIds.length) {
        return null;
    }

    return (
        <AutoSizer>
            {({ height, width }) => (
                <FixedSizeList
                    height = { height }
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
            )}
        </AutoSizer>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<IProps>(MeetingParticipantItems);
