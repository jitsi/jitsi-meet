/**
 * Returns true when a presence stanza represents a successful join.
 * Per XEP-0045 / RFC 6121, available presence has no type attribute or
 * type="available"; error presence has type="error".
 *
 * @param {object} presence - Presence stanza.
 * @returns {boolean}
 */
export function isAvailablePresence(presence) {
    const t = presence.attrs.type;

    return t === undefined || t === 'available';
}

/**
 * Extracts the value of a named field from a disco#info IQ result stanza.
 * Returns the string value, or null if the field is absent or has no value.
 *
 * @param {object} iq      - IQ stanza returned by sendDiscoInfo().
 * @param {string} varName - The field var attribute to look for.
 * @returns {string|null}
 */
export function discoField(iq, varName) {
    const query = iq.getChild('query', 'http://jabber.org/protocol/disco#info');
    const form = query?.getChild('x', 'jabber:x:data');
    const field = form?.getChildren('field').find(f => f.attrs.var === varName);

    return field?.getChild('value')?.text() ?? null;
}
