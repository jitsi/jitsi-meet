// @flow

import React, { Component } from 'react';
import {
    SafeAreaView,
    SectionList,
    Text,
    TouchableHighlight,
    View
} from 'react-native';

import { Icon } from '../../../font-icons';
import { translate } from '../../../i18n';

import styles, { UNDERLAY_COLOR } from './styles';

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function,

    /**
     * Function to be invoked when pull-to-refresh is performed.
     */
    onRefresh: Function,

    /**
     * Function to override the rendered default empty list component.
     */
    renderListEmptyComponent: Function,

    /**
     * Sections to be rendered in the following format:
     *
     * [
     *   {
     *     title: string,               <- section title
     *     key: string,                 <- unique key for the section
     *     data: [                      <- Array of items in the section
     *       {
     *         colorBase: string,       <- the color base of the avatar
     *         title: string,           <- item title
     *         url: string,             <- item url
     *         lines: Array<string>     <- additional lines to be rendered
     *       }
     *     ]
     *   }
     * ]
     */
    sections: Array<Object>
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
    static createSection(title, key) {
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

        this._getAvatarColor = this._getAvatarColor.bind(this);
        this._getItemKey = this._getItemKey.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onRefresh = this._onRefresh.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._renderItemLine = this._renderItemLine.bind(this);
        this._renderItemLines = this._renderItemLines.bind(this);
        this._renderListEmptyComponent
            = this._renderListEmptyComponent.bind(this);
        this._renderSection = this._renderSection.bind(this);
    }

    /**
     * Implements React's Component.render.
     * Note: we don't use the refreshing value yet, because refreshing of these
     * lists is super quick, no need to complicate the code - yet.
     *
     * @inheritdoc
     */
    render() {
        const {
            renderListEmptyComponent = this._renderListEmptyComponent,
            sections
        } = this.props;

        return (
            <SafeAreaView
                style = { styles.container } >
                <SectionList
                    ListEmptyComponent = { renderListEmptyComponent }
                    keyExtractor = { this._getItemKey }
                    onRefresh = { this._onRefresh }
                    refreshing = { false }
                    renderItem = { this._renderItem }
                    renderSectionHeader = { this._renderSection }
                    sections = { sections }
                    style = { styles.list } />
            </SafeAreaView>
        );
    }

    _getAvatarColor: string => Object;

    /**
     * Returns a style (color) based on the string that determines the color of
     * the avatar.
     *
     * @param {string} colorBase - The string that is the base of the color.
     * @private
     * @returns {Object}
     */
    _getAvatarColor(colorBase) {
        if (!colorBase) {
            return null;
        }

        let nameHash = 0;

        for (let i = 0; i < colorBase.length; i++) {
            nameHash += colorBase.codePointAt(i);
        }

        return styles[`avatarColor${(nameHash % 5) + 1}`];
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

    _onPress: string => Function;

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @param {string} url - The URL of the item to navigate to.
     * @private
     * @returns {Function}
     */
    _onPress(url) {
        return () => {
            const { disabled, onPress } = this.props;

            !disabled && url && typeof onPress === 'function' && onPress(url);
        };
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

    _renderItem: Object => Object;

    /**
     * Renders a single item in the list.
     *
     * @param {Object} listItem - The item to render.
     * @private
     * @returns {Component}
     */
    _renderItem(listItem) {
        const { item: { colorBase, lines, title, url } } = listItem;

        // XXX The value of title cannot be undefined; otherwise, react-native
        // will throw a TypeError: Cannot read property of undefined. While it's
        // difficult to get an undefined title and very likely requires the
        // execution of incorrect source code, it is undesirable to break the
        // whole app because of an undefined string.
        if (typeof title === 'undefined') {
            return null;
        }

        return (
            <TouchableHighlight
                onPress = { this._onPress(url) }
                underlayColor = { UNDERLAY_COLOR }>
                <View style = { styles.listItem }>
                    <View style = { styles.avatarContainer } >
                        <View
                            style = { [
                                styles.avatar,
                                this._getAvatarColor(colorBase)
                            ] } >
                            <Text style = { styles.avatarContent }>
                                { title.substr(0, 1).toUpperCase() }
                            </Text>
                        </View>
                    </View>
                    <View style = { styles.listItemDetails }>
                        <Text
                            numberOfLines = { 1 }
                            style = { [
                                styles.listItemText,
                                styles.listItemTitle
                            ] }>
                            { title }
                        </Text>
                        { this._renderItemLines(lines) }
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    _renderItemLine: (string, number) => React$Node;

    /**
     * Renders a single line from the additional lines.
     *
     * @param {string} line - The line text.
     * @param {number} index - The index of the line.
     * @private
     * @returns {React$Node}
     */
    _renderItemLine(line, index) {
        if (!line) {
            return null;
        }

        return (
            <Text
                key = { index }
                numberOfLines = { 1 }
                style = { styles.listItemText }>
                { line }
            </Text>
        );
    }

    _renderItemLines: Array<string> => Array<React$Node>;

    /**
     * Renders the additional item lines, if any.
     *
     * @param {Array<string>} lines - The lines to render.
     * @private
     * @returns {Array<React$Node>}
     */
    _renderItemLines(lines) {
        return lines && lines.length ? lines.map(this._renderItemLine) : null;
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
        const { t, onRefresh } = this.props;

        if (typeof onRefresh === 'function') {
            return (
                <View style = { styles.pullToRefresh }>
                    <Text style = { styles.pullToRefreshText }>
                        { t('sectionList.pullToRefresh') }
                    </Text>
                    <Icon
                        name = 'menu-down'
                        style = { styles.pullToRefreshIcon } />
                </View>
            );
        }

        return null;
    }

    _renderSection: Object => Object;

    /**
     * Renders a section title.
     *
     * @param {Object} section - The section being rendered.
     * @private
     * @returns {React$Node}
     */
    _renderSection(section) {
        return (
            <View style = { styles.listSection }>
                <Text style = { styles.listSectionText }>
                    { section.section.title }
                </Text>
            </View>
        );
    }
}

export default translate(NavigateSectionList);
