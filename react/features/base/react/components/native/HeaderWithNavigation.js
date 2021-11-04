// @flow

import React, { Component } from 'react';

import { translate } from '../../../i18n';

import BackButton from './BackButton';
import ForwardButton from './ForwardButton';
import Header from './Header';
import HeaderLabel from './HeaderLabel';


type Props = {

    /**
     * Boolean to set the forward button disabled.
     */
    forwardDisabled: boolean,

    /**
     * The i18n key of the the forward button label.
     */
    forwardLabelKey: ?string,

    /**
     * The i18n key of the header label (title).
     */
    headerLabelKey: ?string,

    /**
     * True if the header with navigation should be hidden, false otherwise.
     */
    hideHeaderWithNavigation?: boolean,

    /**
     * Callback to be invoked on pressing the back button.
     */
    onPressBack: ?Function,

    /**
     * Callback to be invoked on pressing the forward button.
     */
    onPressForward: ?Function,
}

/**
 * Implements a header with the standard navigation content.
 */
class HeaderWithNavigation extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { hideHeaderWithNavigation, onPressBack, onPressForward } = this.props;

        return (
            !hideHeaderWithNavigation
                    && <Header>
                        { onPressBack && <BackButton onPress = { onPressBack } /> }
                        <HeaderLabel labelKey = { this.props.headerLabelKey } />
                        { onPressForward && <ForwardButton
                            disabled = { this.props.forwardDisabled }
                            labelKey = { this.props.forwardLabelKey }
                            onPress = { onPressForward } /> }
                    </Header>
        );
    }
}

export default translate(HeaderWithNavigation);
