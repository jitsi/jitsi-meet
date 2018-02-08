// @flow
import React from 'react';
import { View, ViewPagerAndroid } from 'react-native';

import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import AbstractPagedList, { DEFAULT_PAGE } from './AbstractPagedList';
import styles from './styles';

/**
 * A platform specific component to render a paged or tabbed list/view.
 *
 * @extends PagedList
 */
export default class PagedList extends AbstractPagedList {

    /**
     * Constructor of the PagedList Component.
     *
     * @inheritdoc
     */
    constructor() {
        super();
        this._getIndicatorStyle = this._getIndicatorStyle.bind(this);
        this._onPageSelected = this._onPageSelected.bind(this);
    }

    /**
     * Renders the paged list.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;

        return (
            <View style = { styles.pagedListContainer }>
                <ViewPagerAndroid
                    initialPage = { DEFAULT_PAGE }
                    keyboardDismissMode = 'on-drag'
                    onPageSelected = { this._onPageSelected }
                    peekEnabled = { true }
                    style = { styles.pagedList }>
                    <View key = { 0 }>
                        <RecentList disabled = { disabled } />
                    </View>
                    <View key = { 1 }>
                        <MeetingList disabled = { disabled } />
                    </View>
                </ViewPagerAndroid>
                <View style = { styles.pageIndicatorContainer }>
                    <View style = { this._getIndicatorStyle(0) } />
                    <View style = { this._getIndicatorStyle(1) } />
                </View>
            </View>
        );
    }

    _getIndicatorStyle: number => Array<Object>;

    /**
     * Constructs the style array of an idicator.
     *
     * @private
     * @param {number} indicatorIndex - The index of the indicator.
     * @returns {Array<Object>}
     */
    _getIndicatorStyle(indicatorIndex) {
        const style = [
            styles.pageIndicator
        ];

        if (this.state.pageIndex === indicatorIndex) {
            style.push(styles.pageIndicatorActive);
        }

        return style;
    }

    _onPageSelected: Object => void;

    /**
     * Updates the index of the currently selected page.
     *
     * @private
     * @param {Object} event - The native event of the callback.
     * @returns {void}
     */
    _onPageSelected({ nativeEvent: { position } }) {
        if (this.state.pageIndex !== position) {
            this.setState({
                pageIndex: position
            });
        }
    }
}
