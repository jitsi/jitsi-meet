import type { Participant } from './Participant';

export type IContext = {
    iframeAPI: boolean;
    iframePageBase: string;
    p1: Participant;
    p2: Participant;
    p3: Participant;
    p4: Participant;
    roomName: string;
};
