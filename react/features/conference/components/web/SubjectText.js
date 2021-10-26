/* @flow */

import React from 'react';

import { getConferenceName } from '../../../base/conference/functions';
import { connect } from '../../../base/redux';
import { Tooltip } from '../../../base/tooltip';

type Props = {

    /**
     * The conference display name.
     */
    _subject: string
}

/**
 * Label for the conference name.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
const SubjectText = ({ _subject }: Props) => (
    <div className = 'subject-text'>
        <Tooltip
            content = { _subject }
            position = 'bottom'>
            <div className = 'subject-text--content'>{ _subject }</div>
        </Tooltip>
    </div>
);


/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 * }}
 */
function _mapStateToProps(state) {
    return {
        _subject: getConferenceName(state)
    };
}

export default connect(_mapStateToProps)(SubjectText);
