module.exports = {
    isRoomValid: (room) => typeof room === 'string' && room.trim().length > 0,
    getCurrentConference: () => undefined,
    forEachConference: () => {}
};
