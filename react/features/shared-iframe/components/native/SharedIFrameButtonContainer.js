import React, { PureComponent } from 'react';

import {
    type AbstractButtonProps
} from '../../../../base/toolbox/components';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { getSharedIFrameInstances } from '../../functions';

import SharedIFrameButton from './SharedIFrameButton';

type Props = AbstractButtonProps & {

    /**
     * The sharedIFrame Buttons to be displayed.
     */
    _sharedIFrames: any[],

};

/**
 * Implements a Container to hold all Buttons needed for the SharedIFrame Feature.
 */
class SharedIFrameButtonContainer extends PureComponent<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { _sharedIFrames } = this.props;

        return (
            Object.keys(_sharedIFrames).map(shareKey => (<SharedIFrameButton
                { ...this.props }
                key = { this.props.buttonKey + shareKey }
                shareKey = { shareKey }
                shareTitle = { _sharedIFrames[shareKey].title || shareKey } />))
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
    return {
        _sharedIFrames: getSharedIFrameInstances(state)
    };
}


export default translate(connect(_mapStateToProps)(SharedIFrameButtonContainer));
