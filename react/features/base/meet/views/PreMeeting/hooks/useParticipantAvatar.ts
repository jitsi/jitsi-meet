import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoadableAvatarUrl } from "../../../../participants/actions";
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

            if (user?.avatar) {
                dispatch(setLoadableAvatarUrl(localParticipant.id, user.avatar, true));
            }

            setInitialized(true);
        }
    }, [localParticipant, initialized, dispatch, localStorage]);
};
