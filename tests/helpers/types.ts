import type { Participant } from './Participant';
import WebhookProxy from './WebhookProxy';

export type IContext = {
    conferenceJid: string;
    iframeAPI: boolean;
    jwtKid: string;
    jwtPrivateKeyPath: string;
    p1: Participant;
    p2: Participant;
    p3: Participant;
    p4: Participant;
    roomName: string;
    webhooksProxy: WebhookProxy;
};

export type IJoinOptions = {

    /**
     * Whether to skip setting display name.
     */
    skipDisplayName?: boolean;

    /**
     * Whether to skip in meeting checks like ice connected and send receive data. For single in meeting participant.
     */
    skipInMeetingChecks?: boolean;
};
