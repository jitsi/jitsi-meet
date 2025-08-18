import { IRoom, IParticipant } from './types';

/**
 * Utility functions for working with participants as Map objects.
 */
export const Participants = {
    /**
     * Get all participant keys from a room.
     */
    keys: (room: IRoom) => [...room.participants.keys()],

    /**
     * Get all participant values from a room.
     */
    values: (room: IRoom) => [...room.participants.values()],

    /**
     * Get all participant entries from a room.
     */
    entries: (room: IRoom) => [...room.participants.entries()],

    /**
     * Convert participants Map to JSON object for serialization.
     */
    toJSON: (room: IRoom) => Object.fromEntries(room.participants),

    /**
     * Convert JSON object to participants Map for deserialization.
     */
    fromJSON: (obj: Record<string, IParticipant>) => new Map(Object.entries(obj)),

    /**
     * Get participant count.
     */
    count: (room: IRoom) => room.participants.size,

    /**
     * Check if room has any participants.
     */
    isEmpty: (room: IRoom) => room.participants.size === 0,

    /**
     * Find participant by JID.
     */
    findByJid: (room: IRoom, jid: string) => room.participants.get(jid),

    /**
     * Find participant by partial JID match.
     */
    findByPartialJid: (room: IRoom, partialJid: string) => {
        const matchedJid = [...room.participants.keys()].find(jid => 
            jid.endsWith(partialJid)
        );
        return matchedJid ? room.participants.get(matchedJid) : undefined;
    },

    /**
     * Find participant by ID (extracted from JID).
     */
    findById: (room: IRoom, id: string) => {
        const matchedJid = [...room.participants.keys()].find(jid => 
            jid.slice(jid.indexOf('/') + 1) === id
        );
        return matchedJid ? room.participants.get(matchedJid) : undefined;
    }
};
