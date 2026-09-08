import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TimeoutType = ReturnType<typeof setTimeout>;

export const NotificationsTransitionContext = React.createContext({
    unmounting: new Map<string, TimeoutType>()
});

/**
 * How long a removed notification is kept mounted so that its exit animation can play.
 */
const UNMOUNT_ANIMATION_TIMEOUT = 250;

const NotificationsTransition = ({ children }: { children: ReactElement[]; }) => {
    const [ childrenToRender, setChildrenToRender ] = useState(children);

    /**
     * The pending removals, by uid. Held in a ref so that the timeout callbacks always act on the current
     * timers instead of the ones captured when they were scheduled, and mirrored into state so that a render
     * is triggered and the notifications which are animating out can be marked as such.
     */
    const timers = useRef(new Map<string, TimeoutType>());
    const [ unmounting, setUnmounting ] = useState(timers.current);

    const removeChild = useCallback((uid: string) => {
        timers.current.delete(uid);
        setUnmounting(new Map(timers.current));
        setChildrenToRender(current => current.filter(child => child.props.uid !== uid));
    }, []);

    useEffect(() => {
        const uids = new Set(children.map(child => child.props.uid));
        let timersChanged = false;

        // A notification that was re-added while it was animating out is displayed again, so its pending
        // removal has to be cancelled. Notifications are keyed by uid and are reused (the lobby one, for
        // example), so without this the removal would fire and drop a notification that is still current.
        timers.current.forEach((timeoutId, uid) => {
            if (uids.has(uid)) {
                clearTimeout(timeoutId);
                timers.current.delete(uid);
                timersChanged = true;
            }
        });

        childrenToRender.forEach(child => {
            const { uid } = child.props;

            if (!uids.has(uid) && !timers.current.has(uid)) {
                timers.current.set(uid, setTimeout(() => removeChild(uid), UNMOUNT_ANIMATION_TIMEOUT));
                timersChanged = true;
            }
        });

        if (timersChanged) {
            setUnmounting(new Map(timers.current));
        }

        setChildrenToRender(current => {
            const toMount = children.filter(child =>
                current.findIndex(c => c.props.uid === child.props.uid) === -1);

            /**
             * Update current notifications.
             * In some cases the UID is the same but the other props change.
             * This way we make sure the notification displays the latest info.
             */
            const updated = current.map(child =>
                children.find(c => c.props.uid === child.props.uid) ?? child);

            return toMount.concat(updated);
        });
    }, [ children ]);

    useEffect(() => {
        const pending = timers.current;

        return () => {
            pending.forEach(timeoutId => clearTimeout(timeoutId));
            pending.clear();
        };
    }, []);

    const context = useMemo(() => {
        return { unmounting };
    }, [ unmounting ]);

    return (
        <NotificationsTransitionContext.Provider value = { context }>
            {childrenToRender}
        </NotificationsTransitionContext.Provider>
    );
};

export default NotificationsTransition;
