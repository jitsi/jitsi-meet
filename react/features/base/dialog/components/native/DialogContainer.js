import React from 'react';

import { ReactionEmoji } from '../../../../reactions/components';
import { getReactionsQueue } from '../../../../reactions/functions.any';
import { connect } from '../../../redux';
import AbstractDialogContainer, {
    abstractMapStateToProps
} from '../AbstractDialogContainer';

/**
 * Implements a DialogContainer responsible for showing all dialogs. We will
 * need a separate container so we can handle multiple dialogs by showing them
 * simultaneously or queueing them.
 *
 * @extends AbstractDialogContainer
 */
class DialogContainer extends AbstractDialogContainer {

    /**
     * Returns the reactions to be displayed.
     *
     * @returns {Array<React$Element>}
     */
    _renderReactions() {
        const { _reactionsQueue } = this.props;

        return _reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
            index = { index }
            key = { uid }
            reaction = { reaction }
            uid = { uid } />));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (<React.Fragment>
            {this._renderReactions()}
            {this._renderDialogContent()}
        </React.Fragment>);
    }
}

const mapStateToProps = state => {
    return {
        ...abstractMapStateToProps(state),
        _reactionsQueue: getReactionsQueue(state)
    };
};

export default connect(mapStateToProps)(DialogContainer);
