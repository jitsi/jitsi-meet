import { useMemo } from "react";
import { UserData } from "../types";

export
const useUserData = (): UserData | null => {
    const xUser = localStorage.getItem("xUser");

    return useMemo(() => {
        if (!xUser) return null;
        try {
            return JSON.parse(xUser);
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    }, [xUser]);
};
