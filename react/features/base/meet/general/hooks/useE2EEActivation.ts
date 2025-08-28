import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IReduxState } from "../../../../app/types";
import { toggleE2EE } from "../../../../e2ee/actions";
import { getIsLobbyVisible } from "../../../../lobby/functions";
import { isPrejoinPageVisible } from "../../../../prejoin/functions";
import { isLocalParticipantModerator } from "../../../participants/functions";


/**
 * Custom Hook to handle automatic activation of E2EE
 * Activated when:
 * - User is moderator
 * - The conference is being displayed (no prejoin or lobby is visible)
 * - There has been a transition from prejoin/lobby to conference
 */
export const useE2EEActivation = (isE2EESupported?: boolean) => {
    const dispatch = useDispatch();

    const isModerator = useSelector(isLocalParticipantModerator);
    const _showLobby = useSelector((state: IReduxState) => getIsLobbyVisible(state));
    const _showPrejoin = useSelector((state: IReduxState) => isPrejoinPageVisible(state));

    const prevShowStateRef = useRef<{ showLobby: boolean; showPrejoin: boolean }>({
        showLobby: _showLobby,
        showPrejoin: _showPrejoin,
    });

    useEffect(() => {
        const wasPrejoinOrLobbyVisible = prevShowStateRef.current.showPrejoin || prevShowStateRef.current.showLobby;
        const isConferenceDisplayed = !_showPrejoin && !_showLobby;

        const shouldActivateE2EE = isE2EESupported &&
            (isConferenceDisplayed && isModerator) ||
            (wasPrejoinOrLobbyVisible && isConferenceDisplayed && isModerator);

        if (shouldActivateE2EE) {
            dispatch(toggleE2EE(true));
        }

        prevShowStateRef.current = {
            showLobby: _showLobby,
            showPrejoin: _showPrejoin,
        };
    }, [_showLobby, _showPrejoin, dispatch, isModerator, isE2EESupported]);
};
