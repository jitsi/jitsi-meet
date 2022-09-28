export interface IRoom {
    id: string;
    isMainRoom?: boolean;
    jid: string;
    name: string;
    participants: {
        [jid: string]: {
            displayName: string;
            jid: string;
            role: string;
        };
    };
}

export interface IRooms {
    [jid: string]: IRoom;
}
