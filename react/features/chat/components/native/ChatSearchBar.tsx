import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.native';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Input from '../../../base/ui/components/native/Input';
import { setChatSearchMatchIndex, setChatSearchQuery } from '../../actions.native';
import { getChatSearchMatchIndex, getChatSearchMatches, getChatSearchQuery } from '../../functions';

import styles from './styles';

interface IProps {
    t: Function;
}

/**
 * Renders an always-visible search bar above the chat message list, allowing
 * the user to filter messages and step through matches.
 *
 * @returns {React.ReactElement}
 */
const ChatSearchBar = ({ t }: IProps) => {
    const dispatch = useDispatch();
    const query = useSelector((state: IReduxState) => getChatSearchQuery(state));
    const matches = useSelector((state: IReduxState) => getChatSearchMatches(state));
    const matchIndex = useSelector((state: IReduxState) => getChatSearchMatchIndex(state));

    const hasQuery = query.trim().length > 0;
    const hasMatches = matches.length > 0;

    const _onChangeText = useCallback((text: string) => {
        dispatch(setChatSearchQuery(text));
    }, [ dispatch ]);

    const _onPrevious = useCallback(() => {
        if (!matches.length) {
            return;
        }

        dispatch(setChatSearchMatchIndex((matchIndex - 1 + matches.length) % matches.length));
    }, [ dispatch, matchIndex, matches.length ]);

    const _onNext = useCallback(() => {
        if (!matches.length) {
            return;
        }

        dispatch(setChatSearchMatchIndex((matchIndex + 1) % matches.length));
    }, [ dispatch, matchIndex, matches.length ]);

    const _onSubmitEditing = useCallback(() => {
        _onNext();
    }, [ _onNext ]);

    return (
        <View style = { styles.searchBarContainer as ViewStyle }>
            <Input
                clearable = { true }
                customStyles = {{
                    clearButton: styles.searchClearButton,
                    container: styles.searchInputContainer,
                    input: styles.searchInput
                }}
                onChange = { _onChangeText }
                onSubmitEditing = { _onSubmitEditing }
                placeholder = { t('chat.search.placeholder') }
                returnKeyType = 'search'
                value = { query } />
            { hasQuery && (
                <>
                    <Text style = { styles.searchBarCounter }>
                        { hasMatches
                            ? t('chat.search.resultsCount', {
                                current: matchIndex + 1,
                                total: matches.length
                            })
                            : t('chat.search.noResults') }
                    </Text>
                    <TouchableOpacity
                        disabled = { !hasMatches }
                        onPress = { _onPrevious }
                        style = { styles.searchBarNavButton as ViewStyle }>
                        <Icon
                            color = { hasMatches ? BaseTheme.palette.icon01 : BaseTheme.palette.icon03 }
                            size = { 18 }
                            src = { IconArrowUp } />
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled = { !hasMatches }
                        onPress = { _onNext }
                        style = { styles.searchBarNavButton as ViewStyle }>
                        <Icon
                            color = { hasMatches ? BaseTheme.palette.icon01 : BaseTheme.palette.icon03 }
                            size = { 18 }
                            src = { IconArrowDown } />
                    </TouchableOpacity>
                </>
            ) }
        </View>
    );
};

export default translate(ChatSearchBar);
