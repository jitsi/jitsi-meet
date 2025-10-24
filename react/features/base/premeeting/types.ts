
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
    fractionalLoss: number;
    jitter: number;
    mediaConnectivity: boolean;
    rtt: number;
    throughput: number;
}
