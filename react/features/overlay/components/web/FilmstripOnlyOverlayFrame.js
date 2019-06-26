// @flow

import React, { Component } from 'react';

import { Avatar } from '../../../base/avatar';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';

import OverlayFrame from './OverlayFrame';

/**
 * The type of the React {@code Component} props of
 * {@link FilmstripOnlyOverlayFrame}.
 */
type Props = {

    /**
     * The ID of the local participant.
     */
    _localParticipantId: string,

    /**
     * The children components to be displayed into the overlay frame for
     * filmstrip only mode.
     */
    children: React$Node,

    /**
     * The css class name for the icon that will be displayed over the avatar.
     */
    icon: string,

    /**
     * Indicates the css style of the overlay. If true, then lighter; darker,
     * otherwise.
     */
    isLightOverlay: boolean
};

/**
 * Implements a React Component for the frame of the overlays in filmstrip only
 * mode.
 */
class FilmstripOnlyOverlayFrame extends Component<Props> {
    /**
     * Renders content related to the icon.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderIcon() {
        if (!this.props.icon) {
            return null;
        }

        const iconClass = `inlay-filmstrip-only__icon ${this.props.icon}`;
        const iconBGClass = 'inlay-filmstrip-only__icon-background';

        return (
            <div>
                <div className = { iconBGClass } />
                <div className = 'inlay-filmstrip-only__icon-container'>
                    <span className = { iconClass } />
                </div>
            </div>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <OverlayFrame isLightOverlay = { this.props.isLightOverlay }>
                <div className = 'inlay-filmstrip-only'>
                    <div className = 'inlay-filmstrip-only__content'>
                        {
                            this.props.children
                        }
                    </div>
                    <div className = 'inlay-filmstrip-only__avatar-container'>
                        <Avatar participantId = { this.props._localParticipantId } />
                        {
                            this._renderIcon()
                        }
                    </div>
                </div>
            </OverlayFrame>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated FilmstripOnlyOverlayFrame
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localParticipantId: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localParticipantId: (getLocalParticipant(state) || {}).id
    };
}

export default connect(_mapStateToProps)(FilmstripOnlyOverlayFrame);
