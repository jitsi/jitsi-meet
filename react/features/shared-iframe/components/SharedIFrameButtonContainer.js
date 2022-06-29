// @flow

import React from 'react';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';

import SharedIFrameButton from './SharedIFrameButton';

type Props = AbstractButtonProps & {

    /**
     * The sharedIFrame Buttons to be displayed.
     */
    _sharedIFrameConfig: any[],

};

/**
 * Implements a Container to hold all Buttons needed for the SharedIFrame Feature.
 */
class SharedIFrameButtonContainer extends React.PureComponent<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { _sharedIFrameConfig } = this.props;

        return (
            Object.keys(_sharedIFrameConfig).map(shareKey => (<SharedIFrameButton
                { ...this.props }
                key = { this.props.buttonKey + shareKey }
                shareKey = { shareKey } />))
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const { sharedIFrameConfig } = state['features/base/config'];

    return {
        _sharedIFrameConfig: sharedIFrameConfig || {}
    };
}


export default translate(connect(_mapStateToProps)(SharedIFrameButtonContainer));
