// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link FormSectionHeader}
 */
type Props = {

    /**
     * The i18n key of the text label of the section.
     */
    label: string,

    /**
     * An external style object passed to the component.
     */
    style: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Implements a React {@code Component} which renders a section header on a
 * form.
 */
class FormSectionHeader extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        const { label, style, t } = this.props;

        return (
            <View
                style = { [
                    styles.formSectionTitle,
                    style
                ] } >
                <Text>
                    { t(label) }
                </Text>
            </View>
        );
    }
}

export default translate(FormSectionHeader);
