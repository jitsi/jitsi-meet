
export enum PreCallTestStatus {
    FAILED = 'FAILED',
    FINISHED = 'FINISHED',
    INITIAL = 'INITIAL',
    RUNNING = 'RUNNING'
}

export interface IPreMeetingState {
    preCallTestState: IPreCallTestState;
    unsafeRoomConsent?: boolean;
}

export interface IPreCallTestState {
    result?: IPreCallResult;
    status: PreCallTestStatus;
}

export interface IPreCallResult {

    // Whether the browser could connect through the TURN servers.
    connected: boolean;
    durationMs: number;

    // The transport to the TURN servers, when connected.
    relayProtocol?: 'tcp' | 'udp';
}
