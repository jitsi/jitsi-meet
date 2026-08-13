import { IStore } from '../../app/types';
import { INetInfoState } from '../net-info/reducer';

import { getCurrentConference } from './functions';
import logger from './logger';

/**
 * How long the network state has to stay put before a change is acted upon. A real interface handover produces a
 * burst of events from the OS (wifi may drop to 'none' and back before settling on cellular), and reacting to each
 * one would request several restarts for a single physical event.
 */
export const NETWORK_CHANGE_DEBOUNCE_MS = 3000;

/**
 * The minimum time between two ICE restarts triggered by a network change. Jicofo rate-limits the requests server
 * side as well; this keeps a flapping radio from burning through that budget.
 */
export const NETWORK_CHANGE_COOLDOWN_MS = 30000;

/**
 * A tag used to make the log lines of this module greppable together with the ones the bridge and Jicofo emit.
 */
const LOG_PREFIX = 'ICE restart (network change):';

/**
 * The identity of the network the current JVB ICE session was established on, as returned by
 * {@link getNetworkIdentity}. A restart is requested when the device's current network no longer matches it.
 */
let sessionNetworkIdentity: string | undefined;

/**
 * Set when a SET_NETWORK_INFO update reports the device offline while a session is active. Consumed (and
 * cleared) the next time the device is back online. A reconnect is treated as a change even if it lands back
 * on the exact same address (e.g. the same DHCP lease) - the interface genuinely went down and came back up,
 * so any ICE candidates gathered on it are stale regardless of whether the address string still matches.
 */
let hadOfflineGap = false;

/**
 * The pending debounce timer, if any.
 */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * When the last restart was requested, used to enforce {@link NETWORK_CHANGE_COOLDOWN_MS}.
 */
let lastRequestTime = 0;

/**
 * Derives a stable identifier for the network the device is currently attached to. Two values comparing unequal
 * mean the local address the media session was set up on is no longer usable, so the session's local ICE
 * candidates are stale.
 *
 * The network type alone is not enough: moving between two wifi networks (leaving home for the office) keeps the
 * type at 'wifi' while changing the local address, so the address is included when the OS reports one. It is
 * reported for wifi and ethernet but not for cellular, so two different cellular attachments are
 * indistinguishable here and will not be detected as a change.
 *
 * @param {INetInfoState} netInfo - The 'base/net-info' state.
 * @returns {string|undefined} - The identity, or undefined if the network type is not known yet.
 */
export function getNetworkIdentity(netInfo?: INetInfoState): string | undefined {
    const networkType = netInfo?.networkType;

    if (!networkType) {
        return undefined;
    }

    const ipAddress = netInfo?.details?.ipAddress;

    return ipAddress ? `${networkType}/${ipAddress}` : networkType;
}

/**
 * Records the network the JVB ICE session has just been established on, so that later changes can be detected
 * relative to it. Called when a conference is joined and after a restart has been requested.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function noteSessionNetwork(store: IStore): void {
    sessionNetworkIdentity = getNetworkIdentity(store.getState()['features/base/net-info']);

    logger.debug(`${LOG_PREFIX} session network is ${sessionNetworkIdentity}`);
}

/**
 * Drops any pending work and forgets the session's network. Called when the conference goes away.
 *
 * @returns {void}
 */
export function resetNetworkChangeState(): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }

    sessionNetworkIdentity = undefined;
    hadOfflineGap = false;
}

/**
 * Requests the restart, if all of the conditions still hold. Everything is re-read from the store here rather than
 * captured when the timer was armed, so that a network which changed and changed back within the debounce window
 * does not produce a pointless restart.
 *
 * @param {IStore} store - The redux store.
 * @private
 * @returns {void}
 */
function _restartIce(store: IStore): void {
    const state = store.getState();
    const netInfo = state['features/base/net-info'];
    const identity = getNetworkIdentity(netInfo);
    const recoveringFromOfflineGap = hadOfflineGap;

    if (!identity || (!recoveringFromOfflineGap && identity === sessionNetworkIdentity)) {
        logger.debug(`${LOG_PREFIX} network settled back to ${sessionNetworkIdentity}, nothing to do`);

        return;
    }

    // Going offline is not something a restart can recover from - there is no interface to move to. The next
    // change, when the device attaches to something, is what we want to act on.
    if (!netInfo?.isOnline) {
        logger.info(`${LOG_PREFIX} offline (${identity}), not requesting a restart`);

        hadOfflineGap = true;

        return;
    }

    hadOfflineGap = false;

    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    if (!conference.isIceRestartSupported()) {
        return;
    }

    // While P2P is active the JVB session is on hold and not carrying media, so there is nothing to preserve.
    if (conference.isP2PActive()) {
        logger.info(`${LOG_PREFIX} P2P is active, not requesting a restart`);

        return;
    }

    const sinceLastRequest = Date.now() - lastRequestTime;

    if (sinceLastRequest < NETWORK_CHANGE_COOLDOWN_MS) {
        logger.warn(`${LOG_PREFIX} suppressed, last request was ${sinceLastRequest}ms ago`);

        return;
    }

    logger.info(`${LOG_PREFIX} requesting a restart, ${sessionNetworkIdentity} -> ${identity}`);

    // Set before the request so that a second change arriving while this one is in flight does not request
    // another restart.
    lastRequestTime = Date.now();

    conference.restartJvbIce('network-change')
        .then(() => {
            // The request was accepted; the bridge's new transport arrives asynchronously. Treat the new network
            // as the session's own from here so a repeat of the same change is not acted upon again.
            noteSessionNetwork(store);
        })
        .catch((error: Error) => {
            // Not fatal and deliberately not escalated: the pre-existing recovery flow (a full session restart
            // once ICE actually fails) is untouched, and until then media keeps flowing on the old path.
            logger.warn(`${LOG_PREFIX} request failed: ${error?.message ?? error}`);
        });
}

/**
 * Reacts to a change of the device's network. An in-place ICE restart is make-before-break - the bridge keeps
 * carrying media on the established path while the new one is brought up - so it is safe to request whenever the
 * local address the session was set up on may have gone stale, rather than only once ICE has failed.
 *
 * The work is debounced; see {@link NETWORK_CHANGE_DEBOUNCE_MS}.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function maybeRestartIceOnNetworkChange(store: IStore): void {
    const state = store.getState();

    // No session to move.
    if (!getCurrentConference(state)) {
        return;
    }

    const netInfo = state['features/base/net-info'];
    const identity = getNetworkIdentity(netInfo);

    if (!identity) {
        return;
    }

    // The OS had not reported a network yet when the conference was joined, so this is the first chance to learn
    // which network the session was established on.
    if (sessionNetworkIdentity === undefined) {
        sessionNetworkIdentity = identity;

        return;
    }

    if (!netInfo?.isOnline) {
        hadOfflineGap = true;

        return;
    }

    // Still on the network the session was established on, and no intervening offline gap to recover from.
    if (identity === sessionNetworkIdentity && !hadOfflineGap) {
        return;
    }

    const { enableIceRestartOnNetworkChange = true } = state['features/base/config'];

    if (!enableIceRestartOnNetworkChange) {
        return;
    }

    logger.debug(`${LOG_PREFIX} ${sessionNetworkIdentity} -> ${identity}, settling for `
        + `${NETWORK_CHANGE_DEBOUNCE_MS}ms`);

    debounceTimer && clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        _restartIce(store);
    }, NETWORK_CHANGE_DEBOUNCE_MS);
}
