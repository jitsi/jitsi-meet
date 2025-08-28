/**
 * The type of the React {@code Component} props of {@link BreakoutRoomNamePrompt}.
 */
export interface IBreakoutRoomNamePromptProps {

    /**
     * The jid of the breakout room to rename.
     */
    breakoutRoomJid: string;

    /**
     * The initial breakout room name.
     */
    initialRoomName: string;
}

/**
 * The available actions for breakout rooms context menu.
 */
export enum BREAKOUT_CONTEXT_MENU_ACTIONS {

    /**
     * Join breakout room.
     */
    JOIN = 1,

    /**
     * Rename breakout room.
     */
    RENAME = 2,

    /**
     * Remove breakout room.
     */
    REMOVE = 3
}
