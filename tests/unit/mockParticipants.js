module.exports = {
    getLocalParticipant: (state) => state?.['features/base/participants']?.local,
    getParticipantById: (state, id) => state?.['features/base/participants']?.remote?.get?.(id) || state?.['features/base/participants']?.[id],
    getParticipantDisplayName: () => '',
    getVirtualScreenshareParticipantOwnerId: (id) => (id ? id.replace(/-screenshare$/, '') : id),
    isScreenShareParticipant: (participant) => Boolean(participant?.isVirtualScreenshareParticipant || participant?.id?.includes('-screenshare')),
    getMutedStateByParticipantAndMediaType: (state, participant, mediaType) => {
        const tracks = state?.['features/base/tracks'] || [];
        if (participant?.local) {
            const t = tracks.find((x) => x.local && x.mediaType === mediaType);
            return !t || Boolean(t.muted);
        }
        const t = tracks.find((x) => x.participantId === participant?.id && x.mediaType === mediaType);
        return !t || Boolean(t.muted);
    }
};
