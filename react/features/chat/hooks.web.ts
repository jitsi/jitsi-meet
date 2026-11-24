import { useSelector } from 'react-redux';

import ChatButton from './components/web/ChatButton';
import { isChatDisabled } from './functions';

interface IChatButtonEntry {
    Content: typeof ChatButton;
    group: number;
    key: string;
}

const chat: IChatButtonEntry = {
    key: 'chat',
    Content: ChatButton,
    group: 2
};

/**
 * A hook that returns the chat button if chat is not disabled.
 *
 * @returns {Object | undefined} - The chat button object or undefined.
 */
export function useChatButton(): IChatButtonEntry | undefined {
    const _isChatDisabled = useSelector(isChatDisabled);

    if (_isChatDisabled) {
        return;
    }

    return chat;
}
