/* @flow */

import React, {Component} from 'react';
import {getParticipantCount} from '../../../base/participants';
import {connect} from '../../../base/redux';
import {getRemoteTracks} from '../../../base/tracks';
import {isToolboxVisible} from '../../../toolbox';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {
    /**
     * Whether the component should be hide.
     */
    hide: boolean,
};

/**
 * RefreshButton react component.
 *
 * @class RefreshButton
 */
class RefreshButton extends Component<Props> {

    constructor(props) {
        super(props);
        this.reload = this.reload.bind(this);
    }

    reload() {
        window.location.reload(true);
    }

    render() {
        if (this.props.hide) {
            return null;
        }
        return (
            <div className={`refreshButtonWrapper`}>
                <div className='refreshButtonContainer'>
                    <div className={`refreshButton`}
                         style={{cursor: 'pointer'}}
                         onClick={this.reload}>
                <span>
                    Trouble Connecting? <strong>Reconnect</strong>
                </span>
                    </div>
                </div>
            </div>
        );
    }
}

function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);
    const toolBoxVisible = isToolboxVisible(state);
    return {
        hide: participantCount > 1 && remoteTracks.length > 0
    };
}

export default connect(_mapStateToProps)(RefreshButton);
