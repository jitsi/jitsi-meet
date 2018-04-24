// @flow

import React from 'react';
import { TabBarIOS } from 'react-native';
import { connect } from 'react-redux';

import AbstractPagedList from './AbstractPagedList';
import styles from './styles';

/**
 * An iOS specific component to render a paged list.
 *
 * @extends PagedList
 */
class PagedList extends AbstractPagedList {

    /**
     * Initializes a new {@code PagedList} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onTabSelected = this._onTabSelected.bind(this);
    }

    _onTabSelected: number => Function;

    /**
     * Constructs a callback to update the selected tab when the bottom bar icon
     * is pressed.
     *
     * @param {number} tabIndex - The selected tab.
     * @private
     * @returns {Function}
     */
    _onTabSelected(tabIndex) {
        return () => super._selectPage(tabIndex);
    }

    _renderPage: (Object, number, boolean) => React$Node

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
        const { pageIndex } = this.state;

        return page.component
            ? <TabBarIOS.Item
                icon = { page.icon }
                key = { index }
                onPress = { this._onTabSelected(index) }
                selected = { pageIndex === index }
                title = { page.title }>
                {
                    React.createElement(
                        page.component,
                        {
                            disabled
                        })
                }
            </TabBarIOS.Item>
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
        const { pages } = this.props;

        return (
            <TabBarIOS
                itemPositioning = 'fill'
                style = { styles.pagedList }>
                {
                    pages.map((page, index) => this._renderPage(
                        page, index, disabled
                    ))
                }
            </TabBarIOS>
        );
    }
}

export default connect()(PagedList);
