import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import {
    IconArrowDown,
    IconArrowUp,
    IconCloseCircle,
    IconCloseLarge,
    IconSearch
} from '../../../base/icons/svg';
import Input from '../../../base/ui/components/web/Input';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import {
    clearChatSearch,
    setChatSearchMatchIndex,
    setChatSearchQuery,
    toggleChat
} from '../../actions.web';
import { ChatTabs } from '../../constants';
import {
    getChatSearchMatchIndex,
    getChatSearchMatches,
    getChatSearchQuery,
    getFocusedTab,
    isChatDisabled
} from '../../functions';

interface IProps {
    className: string;
    isCCTabEnabled: boolean;
    isPollsEnabled: boolean;
    onCancel: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        searchContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            flex: 1,
            marginRight: theme.spacing(3),
            backgroundColor: theme.palette.inputFieldBackground,
            borderRadius: theme.shape.borderRadius,
            paddingRight: theme.spacing(2),

            '&:focus-within': {
                boxShadow: `0px 0px 0px 2px ${theme.palette.inputFieldFocus}`
            }
        },
        inputWrapper: {
            flex: 1,
            minWidth: 0
        },
        searchInputField: {
            backgroundColor: 'transparent !important',
            background: 'transparent !important',
            border: '0 !important',
            boxShadow: 'none !important',
            paddingRight: '4px !important',

            '&:focus': {
                boxShadow: 'none !important'
            }
        },
        divider: {
            width: '1px',
            alignSelf: 'stretch',
            margin: `${theme.spacing(1)}px ${theme.spacing(1)}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.15)'
        },
        resultsCount: {
            ...theme.typography.labelRegular,
            color: theme.palette.text02,
            whiteSpace: 'nowrap',
            minWidth: '48px',
            textAlign: 'center' as const
        },
        navButton: {
            cursor: 'pointer',
            opacity: 1,

            '&.disabled': {
                cursor: 'default',
                opacity: 0.3
            }
        },
        headerActions: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2)
        }
    };
});

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({ className, isCCTabEnabled, isPollsEnabled, onCancel: onCancelProp }: IProps) {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _isChatDisabled = useSelector(isChatDisabled);
    const focusedTab = useSelector(getFocusedTab);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);

    const query = useSelector(getChatSearchQuery);
    const matches = useSelector(getChatSearchMatches);
    const matchIndex = useSelector(getChatSearchMatchIndex);
    const hasMatches = matches.length > 0;
    // Local, un-debounced copy of the input value so typing feels instant, while the
    // Redux dispatch (which drives the expensive getChatSearchMatches filter) is debounced.
    const [ inputValue, setInputValue ] = useState(query);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Keep the local input in sync when the query is cleared/reset from elsewhere
    // (e.g. clearChatSearch dispatched on tab switch or panel close).
    useEffect(() => {
        setInputValue(query);
    }, [ query ]);

    const onCancel = useCallback(() => {
        if (onCancelProp) {
            onCancelProp();
        } else {
            dispatch(toggleChat());
        }
    }, [ onCancelProp ]);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    const onSearchToggle = useCallback(() => {
        setIsSearchOpen(open => !open);
    }, []);

    const onSearchClose = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        dispatch(clearChatSearch());
        setIsSearchOpen(false);
    }, [ dispatch ]);

    const onQueryChange = useCallback((value: string) => {
        setInputValue(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            dispatch(setChatSearchQuery(value));
        }, 200);
    }, [ dispatch ]);

    const onNext = useCallback(() => {
        if (!hasMatches) {
            return;
        }
        dispatch(setChatSearchMatchIndex((matchIndex + 1) % matches.length));
    }, [ dispatch, hasMatches, matchIndex, matches.length ]);

    const onPrev = useCallback(() => {
        if (!hasMatches) {
            return;
        }
        dispatch(setChatSearchMatchIndex((matchIndex - 1 + matches.length) % matches.length));
    }, [ dispatch, hasMatches, matchIndex, matches.length ]);

    const onSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.shiftKey ? onPrev() : onNext();
        } else if (e.key === 'Escape') {
            onSearchClose();
        }
    }, [ onNext, onPrev, onSearchClose ]);

    // Clear any pending debounced dispatch on unmount so it doesn't fire after teardown.
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Keep matchIndex in bounds whenever the match set shrinks (new query, or a message
    // disappearing) so `matches[matchIndex]` never reads undefined downstream.
    useEffect(() => {
        if (matchIndex >= matches.length && matches.length > 0) {
            dispatch(setChatSearchMatchIndex(0));
        }
    }, [ matches.length, matchIndex, dispatch ]);

    // Close the search bar if the user switches away from the Chat tab (e.g. to Polls/CC/
    // File sharing) without closing the whole panel — search only makes sense on the Chat tab.
    useEffect(() => {
        if (isSearchOpen && focusedTab !== ChatTabs.CHAT) {
            setIsSearchOpen(false);
            dispatch(clearChatSearch());
        }
    }, [ focusedTab ]);

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
        return null;
    }

    // Only show the search toggle on the actual chat message tab — searching
    // polls/CC/file-sharing isn't in scope here.
    const showSearchToggle = !_isChatDisabled && focusedTab === ChatTabs.CHAT;

    return (
        <div
            className = { className || 'chat-dialog-header' }>
            {isSearchOpen ? (
                <div
                    className = { classes.searchContainer }
                    onKeyDown = { onSearchKeyDown }>
                    <div className = { classes.inputWrapper }>
                        <Input
                            autoFocus = { true }
                            icon = { IconSearch }
                            id = 'chat-search-input'
                            inputClassName = { classes.searchInputField }
                            onChange = { onQueryChange }
                            placeholder = { t('chat.search.placeholder') }
                            value = { inputValue } />
                    </div>
                    <span className = { classes.resultsCount }>
                        {query.trim()
                            ? t('chat.search.resultsCount', {
                                current: hasMatches ? matchIndex + 1 : 0,
                                total: matches.length
                            })
                            : null}
                    </span>
                    <Icon
                        ariaLabel = { t('chat.search.previous') }
                        className = { cx(classes.navButton, !hasMatches && 'disabled') }
                        onClick = { onPrev }
                        src = { IconArrowUp } />
                    <Icon
                        ariaLabel = { t('chat.search.next') }
                        className = { cx(classes.navButton, !hasMatches && 'disabled') }
                        onClick = { onNext }
                        src = { IconArrowDown } />
                    <span className = { classes.divider } />
                    <Icon
                        ariaLabel = { t('chat.search.close') }
                        onClick = { onSearchClose }
                        size = { 18 }
                        src = { IconCloseCircle } />
                </div>
            ) : (
                <span
                    aria-level = { 1 }
                    role = 'heading'>
                    { t(title) }
                </span>
            )}
            <div className = { classes.headerActions }>
                {!isSearchOpen && showSearchToggle && (
                    <Icon
                        ariaLabel = { t('chat.search.open') }
                        onClick = { onSearchToggle }
                        role = 'button'
                        src = { IconSearch }
                        tabIndex = { 0 } />
                )}
                <Icon
                    ariaLabel = { t('toolbar.closeChat') }
                    onClick = { onCancel }
                    onKeyPress = { onKeyPressHandler }
                    role = 'button'
                    src = { IconCloseLarge }
                    tabIndex = { 0 } />
            </div>
        </div>
    );
}

export default ChatHeader;
