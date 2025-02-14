import { useSelector } from 'react-redux';
import { IReduxState } from '../../../../../app/types';
import { getLocalParticipant, getParticipantDisplayName, getRemoteParticipants } from '../../../../participants/functions';
import { ParticipantData } from '../types';

export const useParticipants = () => {
    const remoteParticipants = useSelector(getRemoteParticipants);
    const localParticipant = useSelector(getLocalParticipant);
    const state = useSelector((state: IReduxState) => state);

    const localParticipantData = localParticipant
        ? {
              id: localParticipant.id,
              name: getParticipantDisplayName(state, localParticipant.id),
              avatar: localParticipant.avatarURL,
              role: localParticipant.role,
              isLocal: true,
              email: localParticipant.email,
          } as ParticipantData
        : null;

    const remoteParticipantsData = Array.from(remoteParticipants.values()).map(
        (participant) => ({
            id: participant.id,
            name: getParticipantDisplayName(state, participant.id),
            avatar: participant.avatarURL,
            role: participant.role,
            isLocal: false,
            email: participant.email,
        } as ParticipantData)
    );

    return {
        allParticipants: [...(localParticipantData ? [localParticipantData] : []), ...remoteParticipantsData],
        localParticipant: localParticipantData,
        remoteParticipants: remoteParticipantsData
    };
};
