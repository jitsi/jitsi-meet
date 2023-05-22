import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { getSecurityUiConfig } from '../../../base/config/functions.any';
import { translate } from '../../../base/i18n/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import Switch from '../../../base/ui/components/web/Switch';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { toggleLobbyMode } from '../../actions';

interface IProps extends WithTranslation {

    /**
     * True if lobby is currently enabled in the conference.
     */
    _lobbyEnabled: boolean;

    /**
     * True if the section should be visible.
     */
    _visible: boolean;

    /**
     * The Redux Dispatch function.
     */
    dispatch: IStore['dispatch'];
}

interface IState {

    /**
     * True if the lobby switch is toggled on.
     */
    lobbyEnabled: boolean;
}

/**
 * Implements a security feature section to control lobby mode.
 */
class LobbySection extends PureComponent<IProps, IState> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            lobbyEnabled: props._lobbyEnabled
        };

        this._onToggleLobby = this._onToggleLobby.bind(this);
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props._lobbyEnabled !== state.lobbyEnabled) {

            return {
                lobbyEnabled: props._lobbyEnabled
            };
        }

        return null;
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <div id = 'lobby-section'>
                <p
                    className = 'description'
                    role = 'banner'>
                    { t('lobby.enableDialogText') }
                </p>
                <div className = 'control-row'>
                    <label htmlFor = 'lobby-section-switch'>
                        { t('lobby.toggleLabel') }
                    </label>
                    <Switch
                        checked = { this.state.lobbyEnabled }
                        id = 'lobby-section-switch'
                        onChange = { this._onToggleLobby } />
                </div>
            </div>
        );
    }

    /**
     * Callback to be invoked when the user toggles the lobby feature on or off.
     *
     * @returns {void}
     */
    _onToggleLobby() {
        const newValue = !this.state.lobbyEnabled;

        this.setState({
            lobbyEnabled: newValue
        });

        this.props.dispatch(toggleLobbyMode(newValue));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { conference } = state['features/base/conference'];
    const { hideLobbyButton } = getSecurityUiConfig(state);

    return {
        _lobbyEnabled: state['features/lobby'].lobbyEnabled,
        _visible: conference?.isLobbySupported() && isLocalParticipantModerator(state)
            && !hideLobbyButton && !isInBreakoutRoom(state)
    };
}

export default translate(connect(mapStateToProps)(LobbySection));
