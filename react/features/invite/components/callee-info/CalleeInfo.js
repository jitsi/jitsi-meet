// @flow

import React, { Component } from 'react';

import { Avatar } from '../../../base/avatar';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getParticipantDisplayName,
    getParticipantPresenceStatus,
    getRemoteParticipants
} from '../../../base/participants';
import { Container, Text } from '../../../base/react';
import { connect } from '../../../base/redux';
import { isLocalTrackMuted } from '../../../base/tracks';
import { CALLING, PresenceLabel } from '../../../presence-status';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link CalleeInfo}.
 */
type Props = {

    /**
     * The callee's information such as display name.
     */
    _callee: Object,

    _isVideoMuted: boolean
};


/**
 * Implements a React {@link Component} which depicts the establishment of a
 * call with a specific remote callee.
 *
 * @augments Component
 */
class CalleeInfo extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            id,
            name,
            status = CALLING
        } = this.props._callee;
        const className = this.props._isVideoMuted ? 'solidBG' : undefined;

        return (
            <Container
                { ...this._style('ringing', className) }
                id = 'ringOverlay'>
                <Container
                    { ...this._style('ringing__content') }>
                    <Avatar
                        { ...this._style('ringing__avatar') }
                        participantId = { id } />
                    <Container { ...this._style('ringing__status') }>
                        <PresenceLabel
                            defaultPresence = { status }
                            { ...this._style('ringing__text') } />
                    </Container>
                    <Container { ...this._style('ringing__name') }>
                        <Text
                            { ...this._style('ringing__text') }>
                            { name }
                        </Text>
                    </Container>
                </Container>
            </Container>
        );
    }

    /**
     * Attempts to convert specified CSS class names into React
     * {@link Component} props {@code style} or {@code className}.
     *
     * @param {Array<string>} classNames - The CSS class names to convert
     * into React {@code Component} props {@code style} or {@code className}.
     * @returns {{
     *     className: string,
     *     style: Object
     * }}
     */
    _style(...classNames: Array<?string>) {
        let className = '';
        let style;

        for (const aClassName of classNames) {
            if (aClassName) {
                // Attempt to convert aClassName into style.
                if (styles && aClassName in styles) {
                    // React Native will accept an Array as the value of the
                    // style prop. However, I do not know about React.
                    style = {
                        ...style,
                        ...styles[aClassName]
                    };
                } else {
                    // Otherwise, leave it as className.
                    className += `${aClassName} `;
                }
            }
        }

        // Choose which of the className and/or style props has a value and,
        // consequently, must be returned.
        const props = {};

        if (className) {
            props.className = className.trim();
        }
        if (style) {
            props.style = style;
        }

        return props;
    }
}

/**
 * Maps (parts of) the redux state to {@code CalleeInfo}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _callee: Object
 * }}
 */
function _mapStateToProps(state) {
    const _isVideoMuted
        = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO);

    // This would be expensive for big calls but the component will be mounted only when there are up
    // to 3 participants in the call.
    for (const [ id, p ] of getRemoteParticipants(state)) {
        if (p.botType === 'poltergeist') {
            return {
                _callee: {
                    id,
                    name: getParticipantDisplayName(state, id),
                    status: getParticipantPresenceStatus(state, id)
                },
                _isVideoMuted
            };
        }
    }

    return {
        _callee: state['features/invite'].initialCalleeInfo,
        _isVideoMuted
    };
}

export default connect(_mapStateToProps)(CalleeInfo);
