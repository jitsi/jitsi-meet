// @flow

import React from 'react';

import { InputDialog } from '../../../../../base/dialog';
import { connect } from '../../../../../base/redux';
import AbstractBreakoutRoomNamePrompt from '../AbstractBreakoutRoomNamePrompt';

/**
 * Implements a component to render a breakout room name prompt.
 */
class BreakoutRoomNamePrompt extends AbstractBreakoutRoomNamePrompt<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.renameBreakoutRoomTitle'
                initialValue = { this.props.initialRoomName }
                onSubmit = { this._onRenameBreakoutRoom } />
        );
    }

    _onRenameBreakoutRoom: () => boolean;
}

export default connect()(BreakoutRoomNamePrompt);
