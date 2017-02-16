import React, { Component } from 'react';

import { FeedbackButton } from '../../feedback';

export default class ExtendedToolbar extends Component {
    render() {
        return (
            <div
                className = 'toolbar'
                id = 'extendedToolbar'>
                <div id = 'extendedToolbarButtons' />

                <FeedbackButton />

                <div id = 'sideToolbarContainer' />
            </div>
        );
    }
}