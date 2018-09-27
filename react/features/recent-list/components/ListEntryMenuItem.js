// @flow

import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import { hideDialog } from '../../base/dialog';

import styles from './styles';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The translated label of the menu item.
     */
    label: string,

    /**
     * Callback for the menu item for when it's pressed.
     */
    onPress: Function
};

/**
 * Implements a menu item in the {@code ListEntryMenuDialog}.
 */
class ListEntryMenuItem extends Component<Props> {
    /**
     * Initiates a new instance of {@code ListEntryMenuItem}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onItemSelected = this._onItemSelected.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <TouchableOpacity
                onPress = { this._onItemSelected }
                style = { styles.menuItem } >
                <Text style = { styles.menuItemText } >
                    { this.props.label }
                </Text>
            </TouchableOpacity>
        );
    }

    _onItemSelected: () => void

    /**
     * Callback to be invoked when a menu item is pressed.
     *
     * @returns {void}
     */
    _onItemSelected() {
        this.props.dispatch(hideDialog());
        this.props.onPress();
    }
}

export default connect()(ListEntryMenuItem);
