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
