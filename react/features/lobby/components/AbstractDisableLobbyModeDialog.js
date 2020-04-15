// @flow

import { PureComponent } from 'react';

import { toggleLobbyMode } from '../actions';

export type Props = {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract class to encapsulate the platform common code of the {@code DisableLobbyModeDialog}.
 */
export default class AbstractDisableLobbyModeDialog<P: Props = Props> extends PureComponent<P> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onDisableLobbyMode = this._onDisableLobbyMode.bind(this);
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
