import { IParticipant } from '../base/participants/types';

export interface IKnockingParticipant extends IParticipant {
    chattingWithModerator?: string;
}
