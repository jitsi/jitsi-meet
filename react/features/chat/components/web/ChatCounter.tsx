import { connect } from 'react-redux';
import { IReduxState } from '../../../app/types';
import { getUnreadPollCount } from '../../../polls/functions';
import { getUnreadCount, getUnreadFilesCount } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link ChatCounter}.
 */
interface IProps {

    /**
     * The value to display as a count.
     */
    _count: number;

    /**
     * True if the chat window should be rendered.
     */
    _isOpen: boolean;
}

/**
 * Implements a React functional component which displays a count of the number of
 * unread chat messages.
 *
 * @returns {React.ReactElement}
 */
const ChatCounter = (props : IProps): React.ReactElement => {
    return (
        <span className = 'badge-round'>

                <span>
                    {
                        !props._isOpen
                        && (props._count || null)
                    }
                </span>
            </span>
    );

}

/**
 * Maps (parts of) the Redux state to the associated {@code ChatCounter}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _count: number,
 *     _isOpen: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { isOpen } = state['features/chat'];

    return {

        _count: getUnreadCount(state) + getUnreadPollCount(state) + getUnreadFilesCount(state),
        _isOpen: isOpen

    };
}

export default connect(_mapStateToProps)(ChatCounter);

