import { IConfig } from '../../react/features/base/config/configType';

import type { Participant } from './Participant';
import WebhookProxy from './WebhookProxy';

export type IContext = {
    conferenceJid: string;
    dialInPin: string;
    iframeAPI: boolean;
    jwtKid: string;
    jwtPrivateKeyPath: string;
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
