import React, { ReactElement, useEffect, useState } from 'react';

export const DialogTransitionContext = React.createContext({ isUnmounting: false });

const DialogTransition = ({ children }: { children: ReactElement | null; }) => {
    const [ childrenToRender, setChildrenToRender ] = useState(children);
    const [ isUnmounting, setIsUnmounting ] = useState(false);

    useEffect(() => {
        if (children === null) {
            setIsUnmounting(true);
            setTimeout(() => {
                setChildrenToRender(children);
                setIsUnmounting(false);
            }, 150);
        } else {
            setChildrenToRender(children);
        }
    }, [ children ]);

    return (
        <DialogTransitionContext.Provider value = {{ isUnmounting }}>
            {childrenToRender}
        </DialogTransitionContext.Provider>
    );
};

export default DialogTransition;
