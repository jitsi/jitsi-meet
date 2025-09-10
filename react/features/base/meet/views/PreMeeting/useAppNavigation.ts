import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { appNavigate } from "../../../../app/actions.web";


export function useAppNavigation() {
    const dispatch = useDispatch();

    useEffect(() => {
        const handlePopState = () => {
            console.log("=== PopState Event ===");
            console.log("Path:", window.location.pathname);
            console.log("State:", window.history.state);

            dispatch(appNavigate(window.location.pathname + window.location.search));
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [dispatch]);
}
