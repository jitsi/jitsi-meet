import assert from 'assert';

import { clearOtlpTraces, getOtlpTraces } from './helpers/test_observer.js';
import { createXmppClient } from './helpers/xmpp_client.js';

// Sender lives on a separate, plain VirtualHost from the receiver under test.
// mod_trace's iq/full hook fires once per host whose event bus a stanza
// passes through (once for the sender's own outbound processing, once for
// delivery to the recipient) — using two different hosts here means the
// hook (loaded only on the receiver's host) fires exactly once, matching
// real jicofo/JVB topology where sender and receiver are never the same host.
const SENDER_DOMAIN = 'whitelist.localhost';

/**
 * Connects a sender client (on SENDER_DOMAIN) and a receiver client (on the
 * given domain) and registers both for afterEach cleanup.
 *
 * @param {string} receiverDomain
 * @param {Array} clients  Cleanup array; both new clients are appended.
 * @returns {Promise<[object, object]>}
 */
async function connectPair(receiverDomain, clients) {
    const a = await createXmppClient({ domain: SENDER_DOMAIN });
    const b = await createXmppClient({ domain: receiverDomain });

    clients.push(a, b);

    return [ a, b ];
}

describe('mod_trace', () => {

    const clients = [];

    beforeEach(() => clearOtlpTraces());

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    describe('when otlp_endpoint is unset', () => {

        it('leaves a conference-modify IQ with traceparent unmodified and exports nothing', async () => {
            const [ a, b ] = await connectPair('trace-disabled.localhost', clients);
            const traceId = 'd'.repeat(32);
            const parentId = 'e'.repeat(16);

            await a.sendConferenceModifyIq(b.jid, { traceId,
                parentId });

            const iq = await b.waitForIq(s => s.getChild('conference-modify', 'jitsi:colibri2'));
            const cm = iq.getChild('conference-modify', 'jitsi:colibri2');
            const tp = cm.getChild('traceparent');

            assert.ok(tp, 'traceparent element should still be present');
            assert.strictEqual(tp.attrs.trace_id, traceId);
            assert.strictEqual(tp.attrs.parent_id, parentId,
                'parent_id must be left untouched when the module is disabled');

            const traces = await getOtlpTraces();

            assert.strictEqual(traces.length, 0, 'no span should be exported when otlp_endpoint is unset');
        });
    });

    describe('when otlp_endpoint is set', () => {

        it('leaves a conference-modify IQ without traceparent unmodified and exports nothing', async () => {
            const [ a, b ] = await connectPair('trace.localhost', clients);

            await a.sendConferenceModifyIq(b.jid);

            const iq = await b.waitForIq(s => s.getChild('conference-modify', 'jitsi:colibri2'));
            const cm = iq.getChild('conference-modify', 'jitsi:colibri2');

            assert.ok(!cm.getChild('traceparent'),
                'no traceparent should be added when the sender did not include one');

            // Give Prosody a moment to (not) export before asserting the negative.
            await new Promise(r => setTimeout(r, 300));

            const traces = await getOtlpTraces();

            assert.strictEqual(traces.length, 0);
        });

        it('rewrites the traceparent parent_id and exports a span for a conference-modify IQ', async () => {
            const [ a, b ] = await connectPair('trace.localhost', clients);
            const traceId = 'a'.repeat(32);
            const parentId = 'b'.repeat(16);

            await a.sendConferenceModifyIq(b.jid, { traceId,
                parentId });

            const iq = await b.waitForIq(s => s.getChild('conference-modify', 'jitsi:colibri2'));
            const cm = iq.getChild('conference-modify', 'jitsi:colibri2');
            const tp = cm.getChild('traceparent');

            assert.ok(tp, 'traceparent element should still be present');
            assert.strictEqual(tp.attrs.trace_id, traceId, 'trace_id must be preserved');
            assert.notStrictEqual(tp.attrs.parent_id, parentId, 'parent_id must be rewritten to the new span id');
            assert.match(tp.attrs.parent_id, /^[0-9a-f]{16}$/, 'rewritten parent_id must be a 16-hex-char span id');

            // Give Prosody a moment to POST the export before polling.
            await new Promise(r => setTimeout(r, 300));

            const traces = await getOtlpTraces();

            assert.strictEqual(traces.length, 1, 'exactly one export request should have been made');

            const [ resourceSpan ] = traces[0].resource_spans;
            const [ scopeSpan ] = resourceSpan.scope_spans;
            const [ span ] = scopeSpan.spans;

            assert.strictEqual(scopeSpan.scope.name, 'muc');
            assert.strictEqual(span.name, 'colibri.conference-modify');
            assert.strictEqual(span.trace_id, traceId);
            assert.strictEqual(span.parent_span_id, parentId,
                'exported span must record the original parent_id as its own parent');
        });
    });
});
