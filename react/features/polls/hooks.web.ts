import { useSelector } from 'react-redux';

import { arePollsDisabled } from '../conference/functions.any';

import PollsButton from './components/web/PollsButton';

const polls = {
    key: 'polls',
    Content: PollsButton,
    group: 2
};

/**
 * A hook that returns the polls button if it is enabled and undefined otherwise.
 *
 * @returns {Object | undefined} - The polls button object or undefined.
 */
export function usePollsButton() {
    const isPollsDisabled = useSelector(arePollsDisabled);

    if (!isPollsDisabled) {
        return polls;
    }
}
