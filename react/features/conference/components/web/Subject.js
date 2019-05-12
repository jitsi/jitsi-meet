/* @flow */

import React, { Component } from 'react';

import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * The subject of the conference.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean
};

/**
 * Subject react component.
 *
 * @class Subject
 */
class Subject extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _subject, _visible } = this.props;

        return (
            <div className = { `subject ${_visible ? 'visible' : ''}` }>
                { _subject }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { subject } = state['features/base/conference'];

    return {
        _subject: subject,
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Subject);
