var config = {
    hosts: {
        domain: 'guest.jit.si',
        muc: 'meet.jit.si', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.lambada.jitsi.net' // FIXME: use XEP-0030
    },
//  getroomnode: function (path) { return 'someprefixpossiblybasedonpath'; },
//  useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server
//  useIPv6: true, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//lambada.jitsi.net/http-bind' // FIXME: use xep-0156 for that
};
