export interface UserData {
    name: string;
    lastname: string;
    avatar: string | null;
}

export type ParticipantData = {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    isLocal: boolean;
    email?: string;
};