module.exports = {
    setAudioMuted: (muted, ensureTrack) => ({ type: 'SET_AUDIO_MUTED', muted, ensureTrack }),
    setVideoMuted: (muted, authority, ensureTrack) => ({ type: 'SET_VIDEO_MUTED', muted, authority, ensureTrack }),
    showNotification: (props, timeout) => ({ type: 'SHOW_NOTIFICATION', props, timeout }),
    participantJoined: (participant) => ({ type: 'PARTICIPANT_JOINED', participant }),
    participantLeft: (id, conference, extra) => ({ type: 'PARTICIPANT_LEFT', id, conference, ...extra }),
    connect: () => Promise.resolve({ type: 'CONNECTION_CONNECT' }),
    disconnect: () => Promise.resolve({ type: 'CONNECTION_DISCONNECT' }),
    getName: () => 'Jitsi Meet',
    determineTranscriptionLanguage: () => 'en',
    conferenceWillInit: () => ({ type: 'CONFERENCE_WILL_INIT' }),
    setObfuscatedRoom: (obfuscatedRoom, obfuscatedRoomSource) => ({
        type: 'SET_OBFUSCATED_ROOM',
        obfuscatedRoom,
        obfuscatedRoomSource
    })
};
