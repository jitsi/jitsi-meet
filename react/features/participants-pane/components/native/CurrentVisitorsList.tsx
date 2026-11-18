import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import { normalizeAccents } from '../../../base/util/strings';
import { subscribeVisitorsList } from '../../../visitors/actions';
import {
    getDisplayName,
    getVisitorsCount,
    getVisitorsList,
    isVisitorsListEnabled,
    isVisitorsListSubscribed,
    shouldDisplayCurrentVisitorsList
} from '../../../visitors/functions';

import ParticipantItem from './ParticipantItem';
import styles from './styles';

interface IProps {

    /**
     * The participants pane search string. A non-empty one expands the list.
     */
    searchString: string;
}

/**
 * Renders the live visitors list inside the participants pane.
 *
 * @param {IProps} props - Component props.
 * @returns {React$Element<any>} The component.
 */
const CurrentVisitorsList = ({ searchString }: IProps) => {
    const visitorsCount = useSelector(getVisitorsCount);
    const visitors = useSelector(getVisitorsList);
    const featureEnabled = useSelector(isVisitorsListEnabled);
    const shouldDisplayList = useSelector(shouldDisplayCurrentVisitorsList);
    const isSubscribed = useSelector(isVisitorsListSubscribed);
    const store = useStore<IReduxState>();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [ collapsed, setCollapsed ] = useState(true);

    const toggleCollapsed = useCallback(() => {
        if (collapsed && featureEnabled && !isSubscribed) {
            dispatch(subscribeVisitorsList());
        }
        setCollapsed(!collapsed);
    }, [ collapsed, dispatch, featureEnabled, isSubscribed ]);

    useEffect(() => {
        if (featureEnabled && searchString) {
            setCollapsed(false);
            if (!isSubscribed) {
                dispatch(subscribeVisitorsList());
            }
        }
    }, [ searchString, dispatch, isSubscribed, featureEnabled ]);

    const keyExtractor = useCallback((v: { id: string; }) => v.id, []);

    // Resolve names once per list/search change; rows reuse them.
    const filtered = useMemo(() => {
        const state = store.getState();
        const search = normalizeAccents(searchString).toLowerCase();

        return visitors
            .map(v => ({ id: v.id, name: getDisplayName(state, v.name) }))
            .filter(v => normalizeAccents(v.name).toLowerCase().includes(search));
    }, [ store, visitors, searchString ]);

    const renderVisitor = useCallback(({ item }: { item: { id: string; name: string; }; }) => (
        <ParticipantItem
            displayName = { item.name }
            participantID = { item.id } />
    ), []);

    if (!shouldDisplayList) {
        return null;
    }

    const title = t('participantsPane.headings.visitorsList', { count: visitorsCount });

    return (
        <>
            <TouchableOpacity
                accessibilityLabel = { title }
                accessibilityRole = 'button'
                accessibilityState = {{ expanded: !collapsed }}
                onPress = { toggleCollapsed }
                style = { styles.listDetails as ViewStyle }>
                <Text style = { styles.meetingListDescription as TextStyle }>
                    { title }
                </Text>
                <Icon
                    size = { 20 }
                    src = { collapsed ? IconArrowDown : IconArrowUp } />
            </TouchableOpacity>
            {
                !collapsed
                && <FlatList
                    data = { filtered }
                    keyExtractor = { keyExtractor }
                    renderItem = { renderVisitor }
                    windowSize = { 2 } />
            }
        </>
    );
};

export default CurrentVisitorsList;
