import { setTestProperties } from '../../../helpers/TestProperties';
import { joinMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2', 'p3', 'p4' ]
});

/**
 * This is a case which fails if jitsi-videobridge doesn't properly forward PLIs from visitors.
 */
describe('Visitor receiving video from a single remote participant', () => {
    it('joining the meeting', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true,
            visitorsLive: true,
        };

        // Force a connection via JVB.
        const configOverwrite = {
            p2p: {
                enabled: false
            }
        };
        const sender = await joinMuc(
            'p1',
            t({ room: ctx.roomName, displayName: 'Sender', moderator: true }), {
                configOverwrite
            }
        );
        const senderEndpointId = await sender.getEndpointId();

        const testVisitor = async function(instanceId: 'p1' | 'p2' | 'p3' | 'p4') {
            const visitor = await joinMuc(
                instanceId,
                t({ room: ctx.roomName, displayName: 'Visitor', visitor: true }), {
                    configOverwrite
                }
            );

            await visitor.waitForIceConnected();

            const iceConnected = performance.now();

            await visitor.driver.waitUntil(
                () => visitor.isRemoteVideoReceivedAndDisplayed(senderEndpointId), {
                    timeout: 10_000,
                    timeoutMsg: `Visitor (${instanceId}) is not receiving video from the sender`
                });

            const duration = performance.now() - iceConnected;

            console.log(`Video displayed after ${duration} ms after ICE connected (${instanceId})`);
        };

        await testVisitor('p2');
        await testVisitor('p3');
        await testVisitor('p4');
    });
});
