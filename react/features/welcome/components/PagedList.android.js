// @flow

import React from 'react';
import { Text, TouchableOpacity, View, ViewPagerAndroid } from 'react-native';
import { connect } from 'react-redux';

import { Icon } from '../../base/font-icons';
import { MeetingList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import AbstractPagedList, { DEFAULT_PAGE } from './AbstractPagedList';
import styles from './styles';

/**
 * A platform specific component to render a paged or tabbed list/view.
 *
 * @extends PagedList
 */
class PagedList extends AbstractPagedList {
    /**
     * A reference to the viewpager.
     */
    _viewPager: Object;

    /**
     * Initializes a new {@code PagedList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._getIndicatorStyle = this._getIndicatorStyle.bind(this);
        this._onPageSelected = this._onPageSelected.bind(this);
        this._onSelectPage = this._onSelectPage.bind(this);
        this._setViewPager = this._setViewPager.bind(this);
    }

    _getIndicatorStyle: number => Object;

    /**
     * Constructs the style of an indicator.
     *
     * @param {number} indicatorIndex - The index of the indicator.
     * @private
     * @returns {Object}
     */
    _getIndicatorStyle(indicatorIndex) {
        if (this.state.pageIndex === indicatorIndex) {
            return styles.pageIndicatorTextActive;
        }

        return null;
    }

    _onPageSelected: Object => void;

    /**
     * Updates the index of the currently selected page.
     *
     * @param {Object} event - The native event of the callback.
     * @private
     * @returns {void}
     */
    _onPageSelected({ nativeEvent: { position } }) {
        if (this.state.pageIndex !== position) {
            this._selectPage(position);
        }
    }

    _onSelectPage: number => Function;

    /**
     * Constructs a function to be used as a callback for the tab bar.
     *
     * @param {number} pageIndex - The index of the page to activate via the
     * callback.
     * @private
     * @returns {Function}
     */
    _onSelectPage(pageIndex) {
        return () => {
            this._viewPager.setPage(pageIndex);
            this._selectPage(pageIndex);
        };
    }

    /**
     * Renders the entire paged list if calendar is enabled.
     *
     * @param {boolean} disabled - True if the rendered lists should be
     * disabled.
     * @returns {ReactElement}
     */
    _renderPagedList(disabled) {
        return (
            <View style = { styles.pagedListContainer }>
                <ViewPagerAndroid
                    initialPage = { DEFAULT_PAGE }
                    onPageSelected = { this._onPageSelected }
                    peekEnabled = { true }
                    ref = { this._setViewPager }
                    style = { styles.pagedList }>
                    <View key = { 0 }>
                        <RecentList disabled = { disabled } />
                    </View>
                    <View key = { 1 }>
                        <MeetingList disabled = { disabled } />
                    </View>
                </ViewPagerAndroid>
                <View style = { styles.pageIndicatorContainer }>
                    <TouchableOpacity
                        disabled = { disabled }
                        onPress = { this._onSelectPage(0) }
                        style = { styles.pageIndicator } >
                        <View style = { styles.pageIndicator }>
                            <Icon
                                name = 'restore'
                                style = { [
                                    styles.pageIndicatorIcon,
                                    this._getIndicatorStyle(0)
                                ] } />
                            <Text
                                style = { [
                                    styles.pageIndicatorText,
                                    this._getIndicatorStyle(0)
                                ] }>
                                History
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled = { disabled }
                        onPress = { this._onSelectPage(1) }
                        style = { styles.pageIndicator } >
                        <View style = { styles.pageIndicator }>
                            <Icon
                                name = 'event_note'
                                style = { [
                                    styles.pageIndicatorIcon,
                                    this._getIndicatorStyle(1)
                                ] } />
                            <Text
                                style = { [
                                    styles.pageIndicatorText,
                                    this._getIndicatorStyle(1)
                                ] }>
                                Calendar
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    _setViewPager: Object => void;

    /**
     * Sets the {@link ViewPagerAndroid} instance.
     *
     * @param {ViewPagerAndroid} viewPager - The {@code ViewPagerAndroid}
     * instance.
     * @private
     * @returns {void}
     */
    _setViewPager(viewPager) {
        this._viewPager = viewPager;
    }
}

export default connect()(PagedList);
