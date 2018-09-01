// @flow

import Button from '@atlaskit/button';
import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';

import { translate } from '../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link JoinButton}.
 */
type Props = {

    /**
     * The function called when the button is pressed.
     */
    onPress: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React Component for joining an existing calendar meeting.
 *
 * @extends Component
 */
class JoinButton extends Component<Props> {

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { onPress, t } = this.props;

        return (
            <Tooltip
                content = { t('calendarSync.joinTooltip') }>
                <Button
                    appearance = 'primary'
                    className = 'join-button'
                    onClick = { onPress }
                    type = 'button'>
                    { t('calendarSync.join') }
                </Button>
            </Tooltip>
        );
    }
}

export default translate(JoinButton);

