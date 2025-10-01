export interface IPromotionRequest {
    from: string;
    nick: string;
}

export interface IVisitorListParticipant {
    id: string;
    name: string;
}

export interface IVisitorChatParticipant {
    id: string;
    isVisitor: true;
    name: string;
}
