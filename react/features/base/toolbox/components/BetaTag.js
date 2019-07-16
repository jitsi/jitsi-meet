// @flow

import React, { Component } from 'react';

import { translate } from '../../i18n';
import { Container, Text } from '../../react';

type Props = {
    t: Function
};

/**
 * Creates a ReactElement for showing a ToolboxItem is for a beta feature.
 *
 * @extends {Component}
 */
class BetaTag extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container className = 'beta-tag'>
                <Text>
                    { this.props.t('recording.beta') }
                </Text>
            </Container>
        );
    }
}

export default translate(BetaTag);
