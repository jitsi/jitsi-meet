// @flow

import React, { Component } from 'react';

// TODO: Maybe try to make all NavigateSectionList components to work for both
// mobile and web, and move them to NavigateSectionList component.
import type { Section } from '../Types';

import {
    NavigateSectionListEmptyComponent,
    NavigateSectionListItem,
    NavigateSectionListSectionHeader,
    SectionList
} from './_';

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * Function to be invoked when an item is long pressed. The item is passed.
     */
    onLongPress: Function,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function,

    /**
     * Function to be invoked when pull-to-refresh is performed.
     */
    onRefresh: Function,

    /**
     * Function to be invoked when a secondary action is performed on an item.
     * The item's ID is passed.
     */
    onSecondaryAction: Function,

    /**
     * Function to override the rendered default empty list component.
     */
    renderListEmptyComponent: Function,

    /**
     * An array of sections.
     */
    sections: Array<Section>
};

/**
 * Implements a general section list to display items that have a URL property
 * and navigates to (probably) meetings, such as the recent list or the meeting
 * list components.
 */
class NavigateSectionList extends Component<Props> {
    /**
     * Creates an empty section object.
     *
     * @param {string} title - The title of the section.
     * @param {string} key - The key of the section. It must be unique.
     * @private
     * @returns {Object}
     */
    static createSection(title: string, key: string) {
        return {
            data: [],
            key,
            title
        };
    }

    /**
     * Constructor of the NavigateSectionList component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        this._getItemKey = this._getItemKey.bind(this);
        this._onLongPress = this._onLongPress.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onRefresh = this._onRefresh.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._renderListEmptyComponent = this._renderListEmptyComponent.bind(this);
        this._renderSectionHeader = this._renderSectionHeader.bind(this);
    }

    /**
     * Implements React's {@code Component.render}.
     * Note: We don't use the refreshing value yet, because refreshing of these
     * lists is super quick, no need to complicate the code - yet.
     *
     * @inheritdoc
     */
    render() {
        const {
            renderListEmptyComponent = this._renderListEmptyComponent(),
            sections
        } = this.props;

        return (
            <SectionList
                ListEmptyComponent = { renderListEmptyComponent }
                keyExtractor = { this._getItemKey }
                onItemClick = { this.props.onPress }
                onRefresh = { this._onRefresh }
                refreshing = { false }
                renderItem = { this._renderItem }
                renderSectionHeader = { this._renderSectionHeader }
                sections = { sections } />
        );
    }

    _getItemKey: (Object, number) => string;

    /**
     * Generates a unique id to every item.
     *
     * @param {Object} item - The item.
     * @param {number} index - The item index.
     * @private
     * @returns {string}
     */
    _getItemKey(item, index) {
        return `${index}-${item.key}`;
    }

    _onLongPress: string => Function;

    /**
     * Returns a function that is used in the onLongPress callback of the items.
     *
     * @param {Object} item - The item that was long-pressed.
     * @private
     * @returns {Function}
     */
    _onLongPress(item) {
        const { disabled, onLongPress } = this.props;

        if (!disabled && typeof onLongPress === 'function') {
            return () => onLongPress(item);
        }

        return null;
    }

    _onPress: string => Function;

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onPress(url) {
        const { disabled, onPress } = this.props;

        if (!disabled && url && typeof onPress === 'function') {
            return () => onPress(url);
        }

        return null;
    }

    _onRefresh: () => void;

    /**
     * Invokes the onRefresh callback if present.
     *
     * @private
     * @returns {void}
     */
    _onRefresh() {
        const { onRefresh } = this.props;

        if (typeof onRefresh === 'function') {
            onRefresh();
        }
    }

    _onSecondaryAction: Object => Function;

    /**
     * Returns a function that is used in the secondaryAction callback of the
     * items.
     *
     * @param {string} id - The id of the item that secondary action was
     * performed on.
     * @private
     * @returns {Function}
     */
    _onSecondaryAction(id) {
        return () => {
            this.props.onSecondaryAction(id);
        };
    }

    _renderItem: Object => Object;

    /**
     * Renders a single item in the list.
     *
     * @param {Object} listItem - The item to render.
     * @param {string} key - The item needed for rendering using map on web.
     * @private
     * @returns {Component}
     */
    _renderItem(listItem, key: string = '') {
        const { item } = listItem;
        const { id, url } = item;

        // XXX The value of title cannot be undefined; otherwise, react-native
        // will throw a TypeError: Cannot read property of undefined. While it's
        // difficult to get an undefined title and very likely requires the
        // execution of incorrect source code, it is undesirable to break the
        // whole app because of an undefined string.
        if (typeof item.title === 'undefined') {
            return null;
        }

        return (
            <NavigateSectionListItem
                item = { item }
                key = { key }
                onLongPress = { url ? this._onLongPress(item) : undefined }
                onPress = { url ? this._onPress(url) : undefined }
                secondaryAction = {
                    url ? undefined : this._onSecondaryAction(id) } />
        );
    }

    _renderListEmptyComponent: () => Object;

    /**
     * Renders a component to display when the list is empty.
     *
     * @param {Object} section - The section being rendered.
     * @private
     * @returns {React$Node}
     */
    _renderListEmptyComponent() {
        const { onRefresh } = this.props;

        if (typeof onRefresh === 'function') {
            return (
                <NavigateSectionListEmptyComponent />
            );
        }

        return null;
    }

    _renderSectionHeader: Object => Object;

    /**
     * Renders a section header.
     *
     * @param {Object} section - The section being rendered.
     * @private
     * @returns {React$Node}
     */
    _renderSectionHeader(section) {
        return (
            <NavigateSectionListSectionHeader
                section = { section } />
        );
    }
}

export default NavigateSectionList;
