import { Participant } from "../../helpers/Participant";

/**
 * Creates a new Participant and joins the MUC with the given name. The jaas-specific properties must be set as
 * environment variables: JAAS_DOMAIN and IFRAME_TENANT.
 *
 * @param roomName The name of the room to join, without the tenant.
 * @param instaceId This is the "name" passed to the Participant, I think it's used to match against one of the
 * pre-configured browser instances in wdio? It must be one of 'p1', 'p2', 'p3', or 'p4'. TODO: figure out how this
 * should be used.
 * @param token the token to use, if any.
 */
export async function joinMuc(roomName: string, instaceId: 'p1' | 'p2' | 'p3' | 'p4', token?: string) {
    if (!process.env.JAAS_DOMAIN || !process.env.IFRAME_TENANT) {
        throw new Error('JAAS_DOMAIN and IFRAME_TENANT environment variables must be set');
    }

    let url = `https://${process.env.JAAS_DOMAIN}/${process.env.IFRAME_TENANT}/${roomName}`
    if (token) {
        url += `?jwt=${token}`
    }
    url += '#config.prejoinConfig.enabled=false'

    const newParticipant = new Participant(instaceId, token);
    try {
        await newParticipant.driver.setTimeout({'pageLoad': 30000});
        await newParticipant.driver.url(url);
        await newParticipant.waitForPageToLoad();
        await newParticipant.waitToJoinMUC();
    } catch (error) {
    }
    return newParticipant;
}
