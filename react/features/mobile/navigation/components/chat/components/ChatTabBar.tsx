import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import React from 'react';
import { Route, TabBarItem, TabBarItemProps } from 'react-native-tab-view';

type TabBarItemWithKey = TabBarItemProps<Route> & { key: string; };

// renderTabBarItem extracts key from the spread props object to satisfy React 19's
// requirement that key must be passed directly to JSX and not via object spread.
const renderTabBarItem = ({ key, ...itemProps }: TabBarItemWithKey) => (
    <TabBarItem
        key = { key }
        { ...itemProps } />
);

const ChatTabBar = (props: MaterialTopTabBarProps) => (
    <MaterialTopTabBar
        { ...props as any }
        renderTabBarItem = { renderTabBarItem } />
);

export default ChatTabBar;
