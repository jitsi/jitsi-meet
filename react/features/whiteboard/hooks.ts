import { useSelector } from 'react-redux';

import WhiteboardButton from './components/web/WhiteboardButton';
import { isWhiteboardButtonVisible } from './functions';

const whiteboard = {
    key: 'whiteboard',
    Content: WhiteboardButton,
    group: 3
};

/**
 * A hook that returns the whiteboard button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useWhiteboardButton() {
    const _isWhiteboardButtonVisible = useSelector(isWhiteboardButtonVisible);

    if (_isWhiteboardButtonVisible) {
        return whiteboard;
    }
}
