// @flow

import React, { useCallback, useState } from 'react';
import type { Dispatch } from 'redux';

import { Icon, IconTrash } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { setChatBackground, toggleChatBackground, setChatMessageBackground } from '../../actions.web';

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
     * Represents the selected chat message background.
     */
    _chatMessageBackground: string,

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
function ChatBackgroundPanel({ _chatMessageBackground, _isBackgroundOpen, dispatch }: Props) {

    const [ colorValue, setColorValue ] = useState(_chatMessageBackground ? _chatMessageBackground : '#ff0000');
    const setChatBackgroundImage = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            dispatch(setChatBackground(image));
            dispatch(toggleChatBackground());
        }
    }, [ images, dispatch ]);

    const removeChatBackground = useCallback(async () => {
        dispatch(setChatBackground(undefined));
        dispatch(toggleChatBackground());
    }, [ dispatch ]);

    const changeMessageColor = useCallback(async e => {
        setColorValue(e.target.value);
        dispatch(setChatMessageBackground(e.target.value));
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
                            role = 'button'
                            size = { 15 }
                            src = { IconTrash } />
                    </div>

                    <div className = 'chat-background-image chat-background-item'>
                        <input
                            className = 'chat-color-picker'
                            onChange = { changeMessageColor }
                            type = 'color'
                            value = { colorValue } />
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
    const { isBackgroundOpen, chatMessageBackground } = state['features/chat'];

    return {
        _isBackgroundOpen: isBackgroundOpen,
        _chatMessageBackground: chatMessageBackground
    };
}

export default connect(_mapStateToProps)(ChatBackgroundPanel);
