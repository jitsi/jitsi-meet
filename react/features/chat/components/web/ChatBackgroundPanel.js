// @flow

import React, { useCallback } from 'react';
import type { Dispatch } from 'redux';

import { Icon, IconTrash } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { setChatBackground, toggleChatBackground } from '../../actions.web';

type Image = {
    tooltip?: string,
    id: string,
    src: string
}

const images: Array<Image> = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/chat-background/chat-background-1.jpeg'
    },
    {
        tooltip: 'image2',
        id: '2',
        src: 'images/chat-background/chat-background-2.jpeg'
    },
    {
        tooltip: 'image3',
        id: '3',
        src: 'images/chat-background/chat-background-3.jpeg'
    },
    {
        tooltip: 'image4',
        id: '4',
        src: 'images/chat-background/chat-background-4.jpeg'
    }
];

type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<any>,

    /**
     * True if the chat background panel should be rendered.
     */
    _isBackgroundOpen: boolean
};

/**
 * Renders chat background panel.
 *
 * @returns {ReactElement}
 */
function ChatBackgroundPanel({ _isBackgroundOpen, dispatch }: Props) {
    const setChatBackgroundImage = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            dispatch(setChatBackground(image));
            dispatch(toggleChatBackground());
        }
    }, [ images, dispatch ]);

    const removeChatBackground = useCallback(async e => {
            dispatch(setChatBackground(undefined));
            dispatch(toggleChatBackground());
    }, [ dispatch ]);

    const onError = event => {
        event.target.style.display = 'none';
    };

    return (
        <div>
            {_isBackgroundOpen && (
                <div className = 'chat-background-panel'>
                    {images.map(image =>
                        (<img
                            className = 'chat-background-image'
                            data-imageid = { image.id }
                            key = { image.id }
                            onClick = { setChatBackgroundImage }
                            // eslint-disable-next-line react/jsx-no-bind
                            onError = { onError }
                            src = { image.src } />)
                    )}
                    <div
                    className = 'chat-background-image chat-background-item'
                    onClick = { removeChatBackground }>
                    <Icon
                        size = { 15}
                        role = 'button'
                        src = { IconTrash }/>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ChatBackgroundPanel} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    const { isBackgroundOpen } = state['features/chat'];

    return {
        _isBackgroundOpen: isBackgroundOpen
    };
}

export default connect(_mapStateToProps)(ChatBackgroundPanel);
