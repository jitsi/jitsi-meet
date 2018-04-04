// @flow
import React from 'react';
import { Text, TouchableOpacity, View, ViewPagerAndroid } from 'react-native';

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
export default class PagedList extends AbstractPagedList {
    /**
     * A reference to the viewpager.
     */
    _viewPager: Object;

    /**
     * Constructor of the PagedList Component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._getIndicatorStyle = this._getIndicatorStyle.bind(this);
        this._onPageSelected = this._onPageSelected.bind(this);
        this._onSelectPage = this._onSelectPage.bind(this);
        this._setPagerReference = this._setPagerReference.bind(this);
    }

    /**
     * Renders the paged list.
     *
     * @inheritdoc
     */
    render() {
        const { disabled } = this.props;
        const { pageIndex } = this.state;

        return (
            <View
                style = { [
                    styles.pagedListContainer,
                    disabled ? styles.pagedListContainerDisabled : null
                ] }>
                <ViewPagerAndroid
                    initialPage = { DEFAULT_PAGE }
                    onPageSelected = { this._onPageSelected }
                    peekEnabled = { true }
                    ref = { this._setPagerReference }
                    style = { styles.pagedList }>
                    <View key = { 0 }>
                        <RecentList disabled = { disabled } />
                    </View>
                    <View key = { 1 }>
                        <MeetingList
                            disabled = { disabled }
                            displayed = { pageIndex === 1 } />
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

    _getIndicatorStyle: number => Object;

    /**
     * Constructs the style of an indicator.
     *
     * @private
     * @param {number} indicatorIndex - The index of the indicator.
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

    _onSelectPage: number => Function

    /**
     * Constructs a function to be used as a callback for the tab bar.
     *
     * @private
     * @param {number} pageIndex - The index of the page to activate via the
     * callback.
     * @returns {Function}
     */
    _onSelectPage(pageIndex) {
        return () => {
            this._viewPager.setPage(pageIndex);
            this.setState({
                pageIndex
            });
        };
    }

    _setPagerReference: Object => void

    /**
     * Sets the pager's reference for direct modification.
     *
     * @private
     * @param {React@Node} component - The pager component.
     * @returns {void}
     */
    _setPagerReference(component) {
        this._viewPager = component;
    }
}
