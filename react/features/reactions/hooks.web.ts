import { useSelector } from 'react-redux';

import ReactionsMenuButton from './components/web/ReactionsMenuButton';
import { isReactionsButtonEnabled } from './functions';

const reactions = {
    key: 'reactions',
    Content: ReactionsMenuButton,
    group: 2
};

/**
 * A hook that returns the reactions button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useReactionsButton() {
    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);

    if (reactionsButtonEnabled) {
        return reactions;
    }
}
