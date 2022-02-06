// @flow

import React from 'react';

import { IconRaisedHand } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import AbstractRaisedHandIndicator, {
    type Props,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @augments Component
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
                backgroundColor = { BaseTheme.palette.warning02 }
                highlight = { true }
                icon = { IconRaisedHand }
                iconSize = { 16 }
                iconStyle = {{ color: BaseTheme.palette.uiBackground }} />
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
