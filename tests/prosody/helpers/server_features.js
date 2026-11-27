const DISCO_INFO_NS = 'http://jabber.org/protocol/disco#info';
const SERVER_FEATURES_NS = 'http://jitsi.org/protocol/server-features';

/**
 * Returns the features a client is told about: in the server features element of the jiconop message and in the
 * disco#info of the main virtual host.
 *
 * @param {object} client - A client from createXmppClient, before it got the jiconop message.
 * @returns {Promise<{jiconop: string[], disco: string[]}>}
 */
export async function getServerFeatures(client) {
    const msg = await client.waitForMessage(m => m.getChild('features', SERVER_FEATURES_NS) !== null);
    const reply = await client.sendDiscoInfo('localhost');
    const vars = el => el.getChildren('feature').map(f => f.attrs.var);

    return {
        disco: vars(reply.getChild('query', DISCO_INFO_NS)),
        jiconop: vars(msg.getChild('features', SERVER_FEATURES_NS))
    };
}
