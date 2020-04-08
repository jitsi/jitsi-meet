/* @flow */

import React, {Component} from 'react';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */

/**
 * RefreshButton react component.
 *
 * @class RefreshButton
 */
export default class RefreshButton extends Component {

    constructor(props) {
        super(props);
        this.reload = this.reload.bind(this);
    }

    reload() {
        window.location.reload(true);
    }

    render() {
        return (
            <div className={`refreshButtonWrapper`}>
                <div className='refreshButtonContainer'>
                    <div className={`refreshButton `}>
                <span>
                    Trouble Connecting? <strong
                    style={{cursor: 'pointer'}}
                    onClick={this.reload}>Re-connect</strong>
                </span>
                    </div>
                </div>
            </div>
        );
    }
}
