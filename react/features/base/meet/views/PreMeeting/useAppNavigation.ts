import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { appNavigate } from "../../../../app/actions.web";


export function useAppNavigation() {
    const dispatch = useDispatch();

    useEffect(() => {
        const handlePopState = () => {
            dispatch(appNavigate(window.location.pathname + window.location.search));
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [dispatch]);
}
