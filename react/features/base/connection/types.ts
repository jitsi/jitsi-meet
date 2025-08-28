/**
 * The error structure passed to the {@link connectionFailed} action.
 *
 * Note there was an intention to make the error resemble an Error instance (to
 * the extent that jitsi-meet needs it).
 */
export type ConnectionFailedError = {

    /**
     * The invalid credentials that were used to authenticate and the
     * authentication failed.
     */
    credentials?: {

        /**
         * The XMPP user's ID.
         */
        jid: string;

        /**
         * The XMPP user's password.
         */
        password: string;
    };

    /**
     * The details about the connection failed event.
     */
    details?: Object;

    /**
     * Error message.
     */
    message?: string;

    /**
     * One of {@link JitsiConnectionError} constants (defined in
     * lib-jitsi-meet).
     */
    name: string;

    /**
     * Indicates whether this event is recoverable or not.
     */
    recoverable?: boolean;
};

/**
 * The value for the username or credential property.
 */
type ReplaceIceServersField = string | null;

/**
 * The value for the urls property.
 */
type IceServerUrls = null | string | Array<string>;

/**
 * The types of ice servers.
 */
enum IceServerType {
    STUN = 'stun',
    TURN = 'turn',
    TURNS = 'turns'
}

/**
 * Represents a single override rule.
 */
interface IReplaceIceServer {

    /**
     * The value the credential prop will be replaced with.
     *
     * NOTE: If the value is null we will remove the credential property in entry that matches the target type. If the
     * value is undefined or missing we won't change the credential property in the entry that matches the target type.
     */
    credential?: ReplaceIceServersField;

    /**
     * Target type that will be used to match the already received ice server and modify/remove it based on the values
     * of credential, urls and username.
     */
    targetType: IceServerType;

    /**
     * The value the urls prop will be replaced with.
     *
     * NOTE: If the value is null we will remove the whole entry that matches the target type. If the value is undefined
     * or missing we won't change the urls property in the entry that matches the target type.
     */
    urls?: IceServerUrls;

    /**
     * The value the username prop will be replaced with.
     *
     * NOTE: If the value is null we will remove the username property in entry that matches the target type. If the
     * value is undefined or missing we won't change the username property in the entry that matches the target type.
     */
    username?: ReplaceIceServersField;
}

/**
 * An object with rules for changing the existing ice server configuration.
 */
export interface IIceServers {

    /**
     * An array of rules for replacing parts from the existing ice server configuration.
     */
    replace: Array<IReplaceIceServer>;
}

