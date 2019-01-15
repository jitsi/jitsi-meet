// @flow

import React, { Component } from 'react';
import { Text } from 'react-native';

import { translate } from '../../../i18n';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link HeaderLabel}
 */
type Props = {

    /**
     * The i18n key of the label to be rendered.
     */
    labelKey: string,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * A component rendering a standard label in the header.
 */
class HeaderLabel extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text
                style = { [
                    styles.headerText
                ] }>
                { this.props.t(this.props.labelKey) }
            </Text>
        );
    }
}

export default translate(HeaderLabel);
