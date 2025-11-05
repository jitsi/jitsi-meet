import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import { hideSheet } from '../../base/dialog/actions';
import BottomSheet from '../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../base/dialog/components/native/styles';
import { Item } from '../../base/react/types';

import DeleteItemButton from './DeleteItemButton.native';
import ShowDialInInfoButton from './ShowDialInInfoButton.native';
import styles from './styles.native';

interface IProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Item being rendered in this menu.
     */
    item: Item;
}

/**
 * Class to implement a popup menu that opens upon long pressing a recent list item.
 */
class RecentListItemMenu extends PureComponent<IProps> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { item } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            itemId: item.id,
            showLabel: true,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }>
                <DeleteItemButton { ...buttonProps } />
                <ShowDialInInfoButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    /**
     * Callback to hide this menu.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { item } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.entryNameContainer as ViewStyle
                ] }>
                <Text
                    ellipsizeMode = { 'middle' }
                    numberOfLines = { 1 }
                    style = { styles.entryNameLabel as TextStyle }>
                    { item.title }
                </Text>
            </View>
        );
    }
}

export default connect()(RecentListItemMenu);
