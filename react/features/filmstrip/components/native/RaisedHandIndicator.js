// @flow

import React from 'react';

import { IconRaisedHand } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractRaisedHandIndicator, {
    type Props,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @extends Component
 */
class RaisedHandIndicator extends AbstractRaisedHandIndicator<Props> {
    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <BaseIndicator
                highlight = { true }
                icon = { IconRaisedHand } />
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
