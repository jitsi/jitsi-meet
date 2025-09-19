import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { participantUpdated, setLoadableAvatarUrl } from "../../../../participants/actions";
import { getLocalParticipant } from "../../../../participants/functions";
import { useLocalStorage } from "../../../LocalStorageManager";

/**
 * Custom hook to initialize and manage the local participant's avatar in a Jitsi conference.
 *
 * This hook automatically retrieves the user's avatar from localStorage and sets it for the
 * local participant when they join a conference. It ensures the avatar is visible both locally
 * and propagated to remote participants through Jitsi's signaling system.
 *
 * @description The hook performs the following operations:
 * - Retrieves the user's avatar URL from localStorage
 * - Sets the avatar for display in the local UI via setLoadableAvatarUrl
 * - Updates the participant data with avatarURL for propagation to remote participants
 * - Ensures the avatar is only set once per conference session
 *
 * @example
 * ```typescript
 * // Use in a conference component
 * function ConferenceView() {
 *   useParticipantAvatar();
 *   // ... rest of component
 * }
 * ```
 *
 * @requires localStorage - Must have user data with avatar property stored
 * @requires localParticipant - Must be called within a conference context
 *
 * @side-effects
 * - Dispatches setLoadableAvatarUrl action to update UI
 * - Dispatches participantUpdated action to sync with other participants
 * - Automatically sends avatar command to remote participants via Jitsi
 *
 * @hook
 * @since 1.0.0
 */
export const useParticipantAvatar = () => {
    const dispatch = useDispatch();
    const localStorage = useLocalStorage();
    const localParticipant = useSelector(getLocalParticipant);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (localParticipant?.id && !initialized) {
            const user = localStorage.getUser();

            if (user?.avatar) {
                dispatch(setLoadableAvatarUrl(localParticipant.id, user.avatar, true));
                dispatch(
                    participantUpdated({
                        id: localParticipant.id,
                        loadableAvatarUrl: user.avatar,
                        avatarURL: user.avatar,
                    })
                );
            }

            setInitialized(true);
        }
    }, [localParticipant, initialized, dispatch, localStorage]);
};
