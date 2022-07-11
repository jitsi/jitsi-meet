// @flow

import React from 'react';

import { LobbyParticipantItem } from './LobbyParticipantItem';

type Props = {

    /**
     * Opens a drawer with actions for a knocking participant.
     */
    openDrawerForParticipant: Function,

    /**
     * If a drawer with actions should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * List with the knocking participants.
     */
    participants: Array<Object>
}

/**
 * Component used to display a list of knocking participants.
 *
 * @param {Object} props - The props of the component.
 * @returns {ReactNode}
 */
function LobbyParticipantItems({ openDrawerForParticipant, overflowDrawer, participants }: Props) {

    return (
        <div id = 'lobby-list'>
            {participants.map(p => (
                <LobbyParticipantItem
                    key = { p.id }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participant = { p } />)
            )}
        </div>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<Props>(LobbyParticipantItems);
