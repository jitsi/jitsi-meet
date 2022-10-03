export interface SipRoom {
    id: string;
    name: string;
}

export interface SipSessionChangedEvent {
    displayName: string;
    failureReason: string;
    newState: string;
}
