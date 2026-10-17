module.exports = {
    getJitsiMeetTransport: () => ({
        send: () => {},
        on: () => {},
        emit: () => {},
        setBackend: () => {}
    }),
    PostMessageTransportBackend: class {},
    Transport: class {}
};
