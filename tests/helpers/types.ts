import { IConfig } from '../../react/features/base/config/configType';

import type { Participant } from './Participant';
import type WebhookProxy from './WebhookProxy';

export type IContext = {
    data: any;
    iframeAPI: boolean;
    isJaasAvailable: () => boolean;
    jwtKid: string;
    jwtPrivateKeyPath: string;
    keepAlive: Array<any>;
    p1: Participant;
    p2: Participant;
    p3: Participant;
    p4: Participant;
    roomName: string;
    skipSuiteTests: boolean;
    times: any;
    webhooksProxy: WebhookProxy;
};

export type IJoinOptions = {

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
};
