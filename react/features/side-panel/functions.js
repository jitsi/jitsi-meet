// @flow

export const getLocalUserId = (state: Object) => {

    const participants = state['features/base/participants'];

    /**
     * Returns a local participant id.
     *
     * @param {Object}  participant - Object from The
     * redux store/state for participants array.
     * @private
     * @returns {string}
     */
    function _getId(participant) {

        // todo fixme: what if name is not found in store?

        if (participant.local === true) {
            return participant;
        }
    }

    const localParticipant = participants.filter(_getId);

    return localParticipant[0].id;

};

export const getLocalDisplayName = (state: Object) => {

    const participants = state['features/base/participants'];

    /**
     * Returns a local participant name.
     *
     * @param {Object}  participant - Object from The
     * redux store/state for participants array.
     * @private
     * @returns {string}
     */
    function _getLocalParticipantName(participant) {

        // todo fixme: what if name is not found in store?

        if (participant.local === true) {
            return participant;
        }
    }

    const localParticipant = participants.filter(_getLocalParticipantName);

    return localParticipant[0].name;

};

export const getSidePanelStatus = (state: Object) => {
    const {
        panelStatus
    } = state['features/side-panel'];


    return panelStatus;
};
