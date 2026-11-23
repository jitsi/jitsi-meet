module.exports = {
    getLocalParticipant: (state) => state?.['features/base/participants']?.local,
    getParticipantById: (state, id) => state?.['features/base/participants']?.remote?.get?.(id) || state?.['features/base/participants']?.[id],
    getParticipantDisplayName: () => ''
};
