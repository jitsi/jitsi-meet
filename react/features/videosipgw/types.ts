export interface ISipRoom {
    id: string;
    name: string;
}

export interface ISipSessionChangedEvent {
    displayName: string;
    failureReason: string;
    newState: string;
}
