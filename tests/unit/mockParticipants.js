module.exports = {
    getLocalParticipant: (state) => state?.['features/base/participants']?.local,
    getParticipantById: () => undefined,
    getParticipantDisplayName: () => ''
};
