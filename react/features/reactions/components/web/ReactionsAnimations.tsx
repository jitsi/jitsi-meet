import React from 'react';
import { useSelector } from 'react-redux';

import { getReactionsQueue, isReactionsEnabled, shouldDisplayReactionsButtons } from '../../functions.any';

import ReactionEmoji from './ReactionEmoji';

/**
 * Renders the reactions animations in the case when there is no buttons displayed.
 *
 * @returns {ReactNode}
 */
export default function ReactionAnimations() {
    const reactionsQueue = useSelector(getReactionsQueue);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const reactionsEnabled = useSelector(isReactionsEnabled);

    if (reactionsEnabled && !_shouldDisplayReactionsButtons) {
        return (<div className = 'reactions-animations-container'>
            {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                index = { index }
                key = { uid }
                reaction = { reaction }
                uid = { uid } />))}
        </div>);
    }

    return null;
}
