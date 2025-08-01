import { IConfig } from '../../react/features/base/config/configType';

import type { Participant } from './Participant';
import { ITestProperties } from './TestProperties';
import type WebhookProxy from './WebhookProxy';

export type IContext = {
    data: any;
    /**
     * Whether the configuration specifies a JaaS account for the iFrame API tests.
     */
    iFrameUsesJaas: boolean;
    jwtKid: string;
    jwtPrivateKeyPath: string;
    keepAlive: Array<any>;
    p1: Participant;
    p2: Participant;
    p3: Participant;
    p4: Participant;
    roomName: string;
    skipSuiteTests: boolean;
    testProperties: ITestProperties;
    times: any;
    webhooksProxy: WebhookProxy;
};

export type ITokenOptions = {
    /**
     * The duration for which the token is valid, e.g. "1h" for one hour.
     */
    exp?: string;
    /**
     * The key ID to use for the token.
     * If not provided, the default key ID from the config will be used.
     */
    keyId?: string;
    /**
     * Whether to set the 'moderator' flag.
     */
    moderator?: boolean;
    /**
     * The room for which the token is valid, or '*'. Defaults to '*'.
     */
    room?: string;
    /**
     * Whether to set the 'visitor' flag.
     */
    visitor?: boolean;
};

export type IJoinOptions = {

    /**
     * Overwrites the base url set in the config.
     */
    baseUrl?: string;

    /**
     * Config overwrites to use.
     */
    configOverwrite?: IConfig;

    /**
     * The display name to use.
     */
    displayName?: string;

    /**
     * When joining the first participant and jwt singing material is available and a provided token
     * is available, prefer generating a new token for the first participant.
     */
    preferGenerateToken?: boolean;

    /**
     * Whether to skip setting display name.
     */
    skipDisplayName?: boolean;

    /**
     * Whether to skip setting the moderator role for the first participant (whether to use jwt for it).
     */
    skipFirstModerator?: boolean;

    /**
     * Whether to skip in meeting checks like ice connected and send receive data. For single in meeting participant.
     */
    skipInMeetingChecks?: boolean;

    /**
     * Whether to skip waiting for the participant to join the room. Cases like lobby where we do not succeed to join
     * based on the logic of the test.
     */
    skipWaitToJoin?: boolean;

    /**
     * Options used when generating a token.
     */
    tokenOptions?: ITokenOptions;
};
