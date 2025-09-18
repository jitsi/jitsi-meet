import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { participantUpdated, setLoadableAvatarUrl } from "../../../../participants/actions";
import { getLocalParticipant } from "../../../../participants/functions";
import { useLocalStorage } from "../../../LocalStorageManager";

export const useParticipantAvatar = () => {
    const dispatch = useDispatch();
    const localStorage = useLocalStorage();
    const localParticipant = useSelector(getLocalParticipant);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (localParticipant?.id && !initialized) {
            const user = localStorage.getUser();

            console.log("user avatar", user?.avatar);
            if (user?.avatar) {
                console.log("setLoadableAvatarUrl", user.avatar);
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
