import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import { toggleChat } from '../../actions.web';
import { ChatTabs } from '../../constants';

interface IProps {

    /**
     * An optional class name.
     */
    className: string;

    /**
     * Whether CC tab is enabled or not.
     */
    isCCTabEnabled: boolean;

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean;

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function;
}

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({ className, isCCTabEnabled, isPollsEnabled }: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { focusedTab } = useSelector((state: IReduxState) => state['features/chat']);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    let title = 'chat.title';

    if (focusedTab === ChatTabs.CHAT) {
        title = 'chat.tabs.chat';
    } else if (isPollsEnabled && focusedTab === ChatTabs.POLLS) {
        title = 'chat.tabs.polls';
    } else if (isCCTabEnabled && focusedTab === ChatTabs.CLOSED_CAPTIONS) {
        title = 'chat.tabs.closedCaptions';
    } else if (fileSharingTabEnabled && focusedTab === ChatTabs.FILE_SHARING) {
        title = 'chat.tabs.fileSharing';
    }

    return (
        <div
            className = { className || 'chat-dialog-header' }>
            <span
                aria-level = { 1 }
                role = 'heading'>
                { t(title) }
            </span>
            <Icon
                ariaLabel = { t('toolbar.closeChat') }
                onClick = { onCancel }
                onKeyPress = { onKeyPressHandler }
                role = 'button'
                src = { IconCloseLarge }
                tabIndex = { 0 } />
        </div>
    );
}

export default ChatHeader;
