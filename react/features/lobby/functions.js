// @flow

declare var interfaceConfig: Object;

/**
 * Returns a displayable name for the knocking participant.
 *
 * @param {string} name - The received name.
 * @returns {string}
 */
export function getKnockingParticipantDisplayName(name: string) {
    if (name) {
        return name;
    }

    return typeof interfaceConfig === 'object'
        ? interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME
        : 'Fellow Jitster';
}

/**
 * Approves (lets in) or rejects a knocking participant.
 *
 * @param {Function} getState - Function to get the Redux state.
 * @param {string} id - The id of the knocking participant.
 * @param {boolean} approved - True if the participant is approved, false otherwise.
 * @returns {Function}
 */
export function setKnockingParticipantApproval(getState: Function, id: string, approved: boolean) {
    const { conference } = getState()['features/base/conference'];

    if (conference) {
        if (approved) {
            conference.lobbyApproveAccess(id);
        } else {
            conference.lobbyDenyAccess(id);
        }
    }
}
