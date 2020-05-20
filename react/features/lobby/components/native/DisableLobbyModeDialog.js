// @flow

import React, { PureComponent } from 'react';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { toggleLobbyMode } from '../../actions';

export type Props = {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function
};

/**
 * Implements a dialog that lets the user disable the lobby mode.
 */
class DisableLobbyModeDialog extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onDisableLobbyMode = this._onDisableLobbyMode.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ConfirmDialog
                contentKey = 'lobby.disableDialogContent'
                onSubmit = { this._onDisableLobbyMode } />
        );
    }

    _onDisableLobbyMode: () => void;

    /**
     * Callback to be invoked when the user initiates the lobby mode disable flow.
     *
     * @returns {void}
     */
    _onDisableLobbyMode() {
        this.props.dispatch(toggleLobbyMode(false));

        return true;
    }
}

export default translate(connect()(DisableLobbyModeDialog));
