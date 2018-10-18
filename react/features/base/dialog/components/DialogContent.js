// @flow

import React, { Component } from 'react';

import { Container, Text } from '../../react';
import { type StyleType } from '../../styles';

import styles from './styles';

type Props = {

    /**
     * Children of the component.
     */
    children: string | React$Node,

    style: ?StyleType
};

/**
 * Generic dialog content container to provide the same styling for all custom
 * dialogs.
 */
export default class DialogContent extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { children, style } = this.props;

        const childrenComponent = typeof children === 'string'
            ? <Text style = { style }>{ children }</Text>
            : children;

        return (
            <Container style = { styles.dialogContainer }>
                { childrenComponent }
            </Container>
        );
    }
}
