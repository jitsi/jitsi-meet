import { useEffect, useState } from 'react';

import isInsecureRoomName from './isInsecureRoomName';

/**
 * Custom hook to check if a room name is insecure asynchronously.
 *
 * @param {string} roomName - The room name to check.
 * @param {boolean} enabled - Whether the check should be performed.
 * @returns {boolean} - Whether the room name is insecure.
 */
export default function useInsecureRoomName(roomName: string, enabled: boolean): boolean {
    const [ isInsecure, setIsInsecure ] = useState(false);

    useEffect(() => {
        if (!enabled || !roomName) {
            setIsInsecure(false);

            return;
        }

        let isMounted = true;

        isInsecureRoomName(roomName)
            .then(result => {
                if (isMounted) {
                    setIsInsecure(result);
                }
            })
            .catch(() => {
                // If zxcvbn fails to load, assume room is secure
                if (isMounted) {
                    setIsInsecure(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [ roomName, enabled ]);

    return isInsecure;
}
