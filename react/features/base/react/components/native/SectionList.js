// @flow

import React, { Component } from 'react';
import {
    SafeAreaView,
    SectionList as ReactNativeSectionList
} from 'react-native';

import type { Section } from '../../Types';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link SectionList}
 */
type Props = {

    /**
     * Rendered when the list is empty. Can be a React Component Class, a render
     * function, or a rendered element.
     */
    ListEmptyComponent: Object,

    /**
    *
    * Used to extract a unique key for a given item at the specified index.
     * Key is used for caching and as the react key to track item re-ordering.
    */
    keyExtractor: Function,

    /**
    *
    * Functions that defines what happens when the list is pulled for refresh
    */
    onRefresh: Function,

    /**
    *
    * A boolean that is set true while waiting for new data from a refresh.
    */
    refreshing: ?boolean,

    /**
    *
    * Default renderer for every item in every section.
    */
    renderItem: Function,

    /**
    *
    * A component rendered at the top of each section. These stick to the top
     * of the ScrollView by default on iOS.
    */
    renderSectionHeader: Object,

    /**
     * An array of sections
     */
    sections: Array<Section>
};

/**
 * Implements a React Native {@link Component} that wraps the React Native
 * SectionList component in a SafeAreaView so that it renders the sectionlist
 * within the safe area of the device
 *
 * @extends Component
 */
export default class SectionList extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <SafeAreaView
                style = { styles.container } >
                <ReactNativeSectionList
                    ListEmptyComponent = { this.props.ListEmptyComponent }
                    keyExtractor = { this.props.keyExtractor }
                    onRefresh = { this.props.onRefresh }
                    refreshing = { this.props.refreshing }
                    renderItem = { this.props.renderItem }
                    renderSectionHeader = { this.props.renderSectionHeader }
                    sections = { this.props.sections }
                    style = { styles.list } />
            </SafeAreaView>
        );
    }
}
