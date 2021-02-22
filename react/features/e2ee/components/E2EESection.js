/* @flow */

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createE2EEEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { getParticipants } from '../../base/participants';
import { Switch } from '../../base/react';
import { connect } from '../../base/redux';
import { toggleE2EE } from '../actions';


type Props = {

    /**
     * Whether E2EE is currently enabled or not.
     */
    _enabled: boolean,

    /**
     * Indicates whether all participants in the conference currently support E2EE.
     */
    _everyoneSupportsE2EE: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

type State = {

    /**
     * True if the switch is toggled on.
     */
    enabled: boolean,

    /**
     * True if the section description should be expanded, false otherwise.
     */
    expand: boolean
};

/**
 * Implements a React {@code Component} for displaying a security dialog section with a field
 * for setting the E2EE key.
 *
 * @extends Component
 */
class E2EESection extends Component<Props, State> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: Object) {
        if (props._enabled !== state.enabled) {

            return {
                enabled: props._enabled
            };
        }

        return null;
    }

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            enabled: false,
            expand: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onExpand = this._onExpand.bind(this);
        this._onToggle = this._onToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _everyoneSupportsE2EE, t } = this.props;
        const { enabled, expand } = this.state;
        const description = t('dialog.e2eeDescription');

        return (
            <div id = 'e2ee-section'>
                <p className = 'description'>
                    { expand && description }
                    { !expand && description.substring(0, 100) }
                    { !expand && <span
                        className = 'read-more'
                        onClick = { this._onExpand }>
                            ... { t('dialog.readMore') }
                    </span> }
                </p>
                {
                    !_everyoneSupportsE2EE
                        && <span className = 'warning'>
                            { t('dialog.e2eeWarning') }
                        </span>
                }
                <div className = 'control-row'>
                    <label>
                        { t('dialog.e2eeLabel') }
                    </label>
                    <Switch
                        onValueChange = { this._onToggle }
                        value = { enabled } />
                </div>
            </div>
        );
    }

    _onExpand: () => void;

    /**
     * Callback to be invoked when the description is expanded.
     *
     * @returns {void}
     */
    _onExpand() {
        this.setState({
            expand: true
        });
    }

    _onToggle: () => void;

    /**
     * Callback to be invoked when the user toggles E2EE on or off.
     *
     * @private
     * @returns {void}
     */
    _onToggle() {
        const newValue = !this.state.enabled;

        this.setState({
            enabled: newValue
        });

        sendAnalytics(createE2EEEvent(`enabled.${String(newValue)}`));
        this.props.dispatch(toggleE2EE(newValue));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { enabled } = state['features/e2ee'];
    const participants = getParticipants(state).filter(p => !p.local);

    return {
        _enabled: enabled,
        _everyoneSupportsE2EE: participants.every(p => Boolean(p.e2eeSupported))
    };
}

export default translate(connect(mapStateToProps)(E2EESection));
