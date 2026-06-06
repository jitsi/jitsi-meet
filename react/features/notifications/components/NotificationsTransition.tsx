import React, { ReactElement, useEffect, useState } from 'react';

export const NotificationsTransitionContext = React.createContext({
    unmounting: new Map<string, TimeoutType | null>()
});

type TimeoutType = ReturnType<typeof setTimeout>;

const NotificationsTransition = ({ children }: { children: ReactElement[]; }) => {
    const [ childrenToRender, setChildrenToRender ] = useState(children);
    const [ timeoutIds, setTimeoutIds ] = useState(new Map<string, TimeoutType | null>());

    useEffect(() => {
        const toUnmount = childrenToRender.filter(child =>
            children.findIndex(c => c.props.uid === child.props.uid) === -1) ?? [];
        const toMount = children?.filter(child =>
            childrenToRender.findIndex(c => c.props.uid === child.props.uid) === -1) ?? [];

        /**
         * Update current notifications.
         * In some cases the UID is the same but the other props change.
         * This way we make sure the notification displays the latest info.
         */
        children.forEach(child => {
            const index = childrenToRender.findIndex(c => c.props.uid === child.props.uid);

            if (index !== -1) {
                childrenToRender[index] = child;
            }
        });

        if (toUnmount.length > 0) {
            const ids = new Map(timeoutIds);

            toUnmount.forEach(child => {
                const timeoutId = setTimeout(() => {
                    timeoutIds.set(child.props.uid, null);
                    setTimeoutIds(timeoutIds);
                }, 250);

                ids.set(child.props.uid, timeoutId);
            });
            setTimeoutIds(ids);
        }

        setChildrenToRender(toMount.concat(childrenToRender));
    }, [ children ]);

    useEffect(() => {
        const toRemove: string[] = [];

        timeoutIds.forEach((value, key) => {
            if (value === null) {
                toRemove.push(key);
                timeoutIds.delete(key);
            }
        });

        toRemove.length > 0 && setChildrenToRender(childrenToRender.filter(child =>
            toRemove.findIndex(id => child.props.uid === id) === -1));
    }, [ timeoutIds ]);

    return (
        <NotificationsTransitionContext.Provider value = {{ unmounting: timeoutIds }}>
            {childrenToRender}
        </NotificationsTransitionContext.Provider>
    );
};

export default NotificationsTransition;
