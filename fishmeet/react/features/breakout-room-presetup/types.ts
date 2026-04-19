export type IMessageData<T = any> = {
    payload?: T;
    type:
    | 'Request-MeetingBreakoutRoomParams'
    | 'Response-MeetingBreakoutRoomParams'
    | 'Received-MeetingBreakoutRoomParams';
};

export type IGroupId = number;
export type IUserId = number;

export type IBreakoutPayload = {
    groupId: IGroupId;
    meetingCode: number;
    meetingData: {
        [key: IGroupId]: IMeetingRoom;
    };
};

export type IMeetingRoom = {
    isMainRoom: boolean;
    name?: string;
    participants: {
        [key: IUserId]: {
            name: string;
            userId: IUserId;
        };
    };
};
