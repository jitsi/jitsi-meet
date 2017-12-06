import React from 'react';
import { ListView, View, TouchableHighlight, Text } from 'react-native';
import { connect } from 'react-redux';

import AbstractRecentList from './AbstractRecentList';

import styles, { UNDERLAY_COLOR } from './styles';

/**
 * The native container rendering the list of the recently joined rooms.
 *
 * @extends AbstractRecentList
 */
class RecentList extends AbstractRecentList {

    /**
     * Initializes a new {@code RecentList} instance.
     *
     */
    constructor() {
        super();

        this._renderRow = this._renderRow.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}. Renders a list of
     * recently joined rooms.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        return (
            <View style = { styles.container }>
                <ListView
                    dataSource = { this.state.dataSource }
                    renderRow = { this._renderRow }
                    renderSeparator = { this._renderSeparator } />
            </View>
        );
    }

    /**
    * Renders a single contact list row.
    *
    * @private
    * @param {Object} data - The row data to be rendered.
    * @returns {ReactElement}
    */
    _renderRow(data) {
        const self = this;

        return (
            <TouchableHighlight
                onPress = { function() {
                    self._onSelect(data.room);
                } }
                underlayColor = { UNDERLAY_COLOR } >
                <View style = { styles.row } >
                    <View style = { styles.avatarContainer } >
                        <Text style = { styles.avatarContent }>
                            { data.initials
                                ? data.initials.toUpperCase() : '?' }
                        </Text>
                    </View>
                    <Text style = { styles.roomName }>
                        { data.room }
                    </Text>
                    <Text style = { styles.date }>
                        { data.date }
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    /**
    * Renders separator lines between rows.
    *
    * @private
    * @param {string} sectionId - The id of the section rendered.
    * @param {string} rowId - The id of the row rendered.
    * @returns {ReactElement}
    */
    _renderSeparator(sectionId, rowId) {
        return (
            <View
                key = { rowId }
                style = { styles.separator } />
        );
    }

}

export default connect()(RecentList);
