// @flow

import React from 'react';
import { Text, TouchableOpacity, View, ViewPagerAndroid } from 'react-native';
import { connect } from 'react-redux';

import { Icon } from '../../../font-icons';

import AbstractPagedList from './AbstractPagedList';
import styles from './styles';

/**
 * An Android specific component to render a paged list.
 *
 * @extends PagedList
 */
class PagedList extends AbstractPagedList {
    /**
     * A reference to the viewpager.
     */
    _viewPager: ViewPagerAndroid;

    /**
     * Initializes a new {@code PagedList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onIconPress = this._onIconPress.bind(this);
        this._getIndicatorStyle = this._getIndicatorStyle.bind(this);
        this._onPageSelected = this._onPageSelected.bind(this);
        this._setViewPager = this._setViewPager.bind(this);
    }

    _onIconPress: number => Function;

    /**
     * Constructs a function to be used as a callback for the icons in the tab
     * bar.
     *
     * @param {number} pageIndex - The index of the page to activate via the
     * callback.
     * @private
     * @returns {Function}
     */
    _onIconPress(pageIndex) {
        return () => {
            this._viewPager.setPage(pageIndex);
            this._selectPage(pageIndex);
        };
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
            return styles.pageIndicatorActive;
        }

        return null;
    }

    _onPageSelected: Object => void;

    /**
     * Updates the index of the currently selected page, based on the native
     * event received from the {@link ViewPagerAndroid} component.
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

    /**
     * Platform specific actions to run on page select.
     *
     * @private
     * @param {number} pageIndex - The selected page index.
     * @returns {void}
     */
    _platformSpecificPageSelect(pageIndex) {
        this._viewPager.setPage(pageIndex);
        this._selectPage(pageIndex);
    }

    /**
     * Renders a single page of the page list.
     *
     * @private
     * @param {Object} page - The page to render.
     * @param {number} index - The index of the rendered page.
     * @param {boolean} disabled - Renders the page disabled.
     * @returns {React$Node}
     */
    _renderPage(page, index, disabled) {
        return page.component
            ? <View key = { index }>
                {
                    React.createElement(
                        page.component,
                        {
                            disabled
                        })
                }
            </View>
            : null;
    }

    /**
     * Renders a page indicator (icon) for the page.
     *
     * @private
     * @param {Object} page - The page the indicator is rendered for.
     * @param {number} index - The index of the page the indicator is rendered
     * for.
     * @param {boolean} disabled - Renders the indicator disabled.
     * @returns {React$Node}
     */
    _renderPageIndicator(page, index, disabled) {
        return page.component
            ? <TouchableOpacity
                disabled = { disabled }
                key = { index }
                onPress = { this._onIconPress(index) }
                style = { styles.pageIndicator } >
                <View style = { styles.pageIndicator }>
                    <Icon
                        name = { page.icon }
                        style = { [
                            styles.pageIndicatorIcon,
                            this._getIndicatorStyle(index)
                        ] } />
                    <Text
                        style = { [
                            styles.pageIndicatorText,
                            this._getIndicatorStyle(index)
                        ] }>
                        { page.title }
                    </Text>
                </View>
            </TouchableOpacity>
            : null;
    }

    /**
     * Renders the paged list if multiple pages are to be rendered. This is the
     * platform dependent part of the component.
     *
     * @param {boolean} disabled - True if the rendered lists should be
     * disabled.
     * @returns {ReactElement}
     */
    _renderPagedList(disabled) {
        const { defaultPage, pages } = this.props;

        return (
            <View style = { styles.pagedListContainer }>
                <ViewPagerAndroid
                    initialPage = { defaultPage }
                    onPageSelected = { this._onPageSelected }
                    peekEnabled = { true }
                    ref = { this._setViewPager }
                    style = { styles.pagedList }>
                    {
                        pages.map((page, index) => this._renderPage(
                            page, index, disabled
                        ))
                    }
                </ViewPagerAndroid>
                <View style = { styles.pageIndicatorContainer }>
                    {
                        pages.map((page, index) => this._renderPageIndicator(
                            page, index, disabled
                        ))
                    }
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
