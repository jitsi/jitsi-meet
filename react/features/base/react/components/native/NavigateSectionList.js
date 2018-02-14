// @flow
import React, { Component } from 'react';
import {
    SafeAreaView,
    SectionList,
    Text,
    TouchableHighlight,
    View
} from 'react-native';

import styles, { UNDERLAY_COLOR } from './styles';

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: Function,

    /**
     * Function to be invoked when pull-to-refresh is performed.
     */
    onRefresh: Function,

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
}

/**
 * Implements a general section list to display items that have a URL
 * property and navigates to (probably) meetings, such as the recent list
 * or the meeting list components.
 */
export default class NavigateSectionList extends Component<Props> {
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
        this._renderSection = this._renderSection.bind(this);
    }

    /**
     * Implements React's Component.render function.
     * Note: we don't use the refreshing value yet, because refreshing of these
     * lists is super quick, no need to complicate the code - yet.
     *
     * @inheritdoc
     */
    render() {
        const { sections } = this.props;

        return (
            <SafeAreaView
                style = { styles.container } >
                <SectionList
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

    /**
     * Creates an empty section object.
     *
     * @private
     * @param {string} title - The title of the section.
     * @param {string} key - The key of the section. It must be unique.
     * @returns {Object}
     */
    static createSection(title, key) {
        return {
            data: [],
            key,
            title
        };
    }

    _getAvatarColor: string => Object

    /**
     * Returns a style (color) based on the string that determines the
     * color of the avatar.
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
     * @private
     * @param {Object} item - The item.
     * @param {number} index - The item index.
     * @returns {string}
     */
    _getItemKey(item, index) {
        return `${index}-${item.key}`;
    }

    _onPress: string => Function

    /**
     * Returns a function that is used in the onPress callback of the items.
     *
     * @private
     * @param {string} url - The URL of the item to navigate to.
     * @returns {Function}
     */
    _onPress(url) {
        return () => {
            const { disabled, onPress } = this.props;

            !disabled && url && typeof onPress === 'function' && onPress(url);
        };
    }

    _onRefresh: () => void

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
     * @private
     * @param {Object} listItem - The item to render.
     * @returns {Component}
     */
    _renderItem(listItem) {
        const { item } = listItem;

        return (
            <TouchableHighlight
                onPress = { this._onPress(item.url) }
                underlayColor = { UNDERLAY_COLOR }>
                <View style = { styles.listItem }>
                    <View style = { styles.avatarContainer } >
                        <View
                            style = { [
                                styles.avatar,
                                this._getAvatarColor(item.colorBase)
                            ] } >
                            <Text style = { styles.avatarContent }>
                                { item.title.substr(0, 1).toUpperCase() }
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
                            { item.title }
                        </Text>
                        {
                            this._renderItemLines(item.lines)
                        }
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    _renderItemLine: (string, number) => React$Node;

    /**
     * Renders a single line from the additional lines.
     *
     * @private
     * @param {string} line - The line text.
     * @param {number} index - The index of the line.
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

    _renderItemLines: (Array<string>) => Array<React$Node>;

    /**
     * Renders the additional item lines, if any.
     *
     * @private
     * @param {Array<string>} lines - The lines to render.
     * @returns {Array<React$Node>}
     */
    _renderItemLines(lines) {
        if (lines && lines.length) {
            return lines.map((line, index) =>
                this._renderItemLine(line, index)
            );
        }

        return null;
    }

    _renderSection: Object => Object

    /**
     * Renders a section title.
     *
     * @private
     * @param {Object} section - The section being rendered.
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
