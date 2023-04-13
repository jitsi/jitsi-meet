import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';

interface IProps {
    _message?: string;
}

const Notice = ({ _message }: IProps) => {
    if (!_message) {
        return null;
    }

    return (
        <div className = 'notice'>
            <span className = 'notice__message' >
                {_message}
            </span>
        </div>
    );
};

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Notice}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _message: string,
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const {
        noticeMessage
    } = state['features/base/config'];

    return {
        _message: noticeMessage
    };
}
export default connect(_mapStateToProps)(Notice);
