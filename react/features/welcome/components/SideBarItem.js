// @flow

import React, { Component } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { translate } from '../../base/i18n';
import { Icon } from '../../base/icons';

import styles from './styles';

type Props = {

    /**
     * The icon of the item.
     */
    icon: Object,

    /**
     * The i18n label of the item.
     */
    label: string,

    /**
     * The function to be invoked when the item is pressed
     * if the item is a button.
     */
    onPress: Function,

    /**
     * The translate function.
     */
    t: Function,

    /**
     * The URL of the link, if this item is a link.
     */
    url: string
};

/**
 * A component rendering an item in the system sidebar.
 */
class SideBarItem extends Component<Props> {

    /**
     * Initializes a new {@code SideBarItem} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onOpenURL = this._onOpenURL.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}, renders the sidebar item.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { label, onPress, t } = this.props;
        const onPressCalculated
            = typeof onPress === 'function' ? onPress : this._onOpenURL;

        return (
            <TouchableOpacity
                onPress = { onPressCalculated }
                style = { styles.sideBarItem }>
                <View style = { styles.sideBarItemButtonContainer }>
                    <Icon
                        src = { this.props.icon }
                        style = { styles.sideBarItemIcon } />
                    <Text style = { styles.sideBarItemText }>
                        { t(label) }
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    _onOpenURL: () => void;

    /**
     * Opens the URL if one is provided.
     *
     * @private
     * @returns {void}
     */
    _onOpenURL() {
        const { url } = this.props;

        if (typeof url === 'string') {
            Linking.openURL(url);
        }
    }
}

export default translate(SideBarItem);
