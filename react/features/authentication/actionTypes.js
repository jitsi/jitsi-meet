/**
 * The type of (redux) action which signals that {@link LoginDialog} has been
 * canceled.
 *
 * {
 *     type: CANCEL_LOGIN
 * }
 */
export const CANCEL_LOGIN = Symbol('CANCEL_LOGIN');

/**
 * The type of (redux) action which signals that the {@link WaitForOwnerDialog}
 * has been canceled.
 *
 * {
 *     type: CANCEL_WAIT_FOR_OWNER
 * }
 */
export const CANCEL_WAIT_FOR_OWNER = Symbol('CANCEL_WAIT_FOR_OWNER');

/**
 * The type of (redux) action which signals that the cyclic operation of waiting
 * for conference owner has been aborted.
 *
 * {
 *     type: STOP_WAIT_FOR_OWNER
 * }
 */
export const STOP_WAIT_FOR_OWNER = Symbol('STOP_WAIT_FOR_OWNER');

/**
 * The type of (redux) action which informs that the authentication and role
 * upgrade process has finished either with success or with a specific error.
 * If {@code error} is {@code undefined}, then the process succeeded;
 * otherwise, it failed. Refer to
 * {@link JitsiConference#authenticateAndUpgradeRole} in lib-jitsi-meet for the
 * error details.
 *
 * {
 *     type: UPGRADE_ROLE_FINISHED,
 *     error: Object,
 *     progress: number,
 *     thenableWithCancel: Object
 * }
 */
export const UPGRADE_ROLE_FINISHED = Symbol('UPGRADE_ROLE_FINISHED');

/**
 * The type of (redux) action which signals that the process of authenticating
 * and upgrading the local participant's role has been started.
 *
 * {
 *     type: UPGRADE_ROLE_STARTED,
 *     thenableWithCancel: Object
 * }
 */
export const UPGRADE_ROLE_STARTED = Symbol('UPGRADE_ROLE_STARTED');

/**
 * The type of (redux) action that sets delayed handler which will check if
 * the conference has been created and it's now possible to join from anonymous
 * connection.
 *
 * {
 *     type: WAIT_FOR_OWNER,
 *     handler: Function,
 *     timeoutMs: number
 * }
 */
export const WAIT_FOR_OWNER = Symbol('WAIT_FOR_OWNER');
