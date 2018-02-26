// @flow

import React, { Component } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '../../base/font-icons';
import { translate } from '../../base/i18n';

import styles from './styles';

type Props = {

    /**
     * The i18n label of the item.
     */
    i18Label: string,

    /**
     * The icon of the item.
     */
    icon: string,

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
        const { onPress, t } = this.props;
        const onPressCalculated
            = typeof onPress === 'function' ? onPress : this._onOpenURL;

        return (
            <TouchableOpacity
                onPress = { onPressCalculated }
                style = { styles.sideBarItem }>
                <View style = { styles.sideBarItemButtonContainer }>
                    <Icon
                        name = { this.props.icon }
                        style = { styles.sideBarItemIcon } />
                    <Text style = { styles.sideBarItemText }>
                        { t(this.props.i18Label) }
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
