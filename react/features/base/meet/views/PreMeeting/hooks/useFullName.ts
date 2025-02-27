import { useEffect, useState } from "react";
import { UserData } from "../types";

export const useFullName = (userData: UserData | null, initialValue: string = "") => {
    const getInitialFullName = () => {
        if (!userData?.name && !userData?.lastname) return initialValue;
        return `${userData.name || ""} ${userData.lastname || ""}`.trim();
    };

    const [fullName, setFullName] = useState(getInitialFullName());

    useEffect(() => {
        const newFullName = getInitialFullName();
        if (newFullName !== fullName) {
            setFullName(newFullName);
        }
    }, [userData?.name, userData?.lastname]);

    return [fullName, setFullName] as const;
};