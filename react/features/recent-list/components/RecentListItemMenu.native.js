// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../base/dialog';
import { type Item } from '../../base/react/Types';
import { connect } from '../../base/redux';
import { StyleType } from '../../base/styles';

import DeleteItemButton from './DeleteItemButton.native';
import ShowDialInInfoButton from './ShowDialInInfoButton.native';
import styles from './styles';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Item being rendered in this menu.
     */
    item: Item,

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean
}

// eslint-disable-next-line prefer-const
let RecentListItemMenu_;

/**
 * Class to implement a popup menu that opens upon long pressing a recent list item.
 */
class RecentListItemMenu extends PureComponent<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _bottomSheetStyles, item } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            itemId: item.id,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }>
                <DeleteItemButton { ...buttonProps } />
                <ShowDialInInfoButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Callback to hide this menu.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(RecentListItemMenu_));

            return true;
        }

        return false;
    }

    _renderMenuHeader: () => React$Element<any>;

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _bottomSheetStyles, item } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
                    styles.entryNameContainer
                ] }>
                <Text
                    ellipsizeMode = { 'middle' }
                    numberOfLines = { 1 }
                    style = { styles.entryNameLabel }>
                    { item.title }
                </Text>
            </View>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, RecentListItemMenu_)
    };
}

RecentListItemMenu_ = connect(_mapStateToProps)(RecentListItemMenu);

export default RecentListItemMenu_;
