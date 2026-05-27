import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconSearch } from '../../../base/icons/svg';
import Input from '../../../base/ui/components/web/Input';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import { setChatSearchString, toggleChat } from '../../actions.web';
import { ChatTabs } from '../../constants';
import { getFocusedTab, isChatDisabled } from '../../functions';
import { IReduxState } from '../../../app/types';

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
    const _isChatDisabled = useSelector(isChatDisabled);
    const focusedTab = useSelector(getFocusedTab);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);
    const searchString = useSelector((state: IReduxState) => state['features/chat'].searchString);
    const [ isSearchVisible, setIsSearchVisible ] = useState(false);

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    const toggleSearch = useCallback(() => {
        setIsSearchVisible(prev => !prev);
        if (isSearchVisible) {
            dispatch(setChatSearchString(''));
        }
    }, [ isSearchVisible ]);

    const onSearchChange = useCallback((value: string) => {
        dispatch(setChatSearchString(value));
    }, []);

    let title = 'chat.title';

    if (!_isChatDisabled && focusedTab === ChatTabs.CHAT) {
        title = 'chat.tabs.chat';
    } else if (isPollsEnabled && focusedTab === ChatTabs.POLLS) {
        title = 'chat.tabs.polls';
    } else if (isCCTabEnabled && focusedTab === ChatTabs.CLOSED_CAPTIONS) {
        title = 'chat.tabs.closedCaptions';
    } else if (fileSharingTabEnabled && focusedTab === ChatTabs.FILE_SHARING) {
        title = 'chat.tabs.fileSharing';
    } else {
        // If the focused tab is not enabled, don't render the header.
        // This should not happen in normal circumstances since Chat.tsx already checks
        // if any tabs are available before rendering.
        return null;
    }

    return (
        <div
            className = { className || 'chat-dialog-header' }>
            <span
                aria-level = { 1 }
                role = 'heading'>
                { t(title) }
            </span>
            {focusedTab === ChatTabs.CHAT && (
                <div className = 'chat-header-search'>
                    {isSearchVisible ? (
                        <Input
                            autoFocus = { true }
                            className = 'chat-search-input'
                            clearable = { true }
                            id = 'chat-search'
                            onChange = { onSearchChange }
                            placeholder = { t('chat.searchPlaceholder') }
                            value = { searchString }
                        />
                    ) : (
                        <Icon
                            ariaLabel = { t('chat.search') }
                            onClick = { toggleSearch }
                            role = 'button'
                            src = { IconSearch }
                            tabIndex = { 0 } />
                    )}
                </div>
            )}
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
