import React, { useState } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { setBackgroundImage } from '../actions';

const images = [
    {
        tooltip: 'Image 1',
        name: 'background-1.jpg',
        id: 'image_1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'Image 2',
        name: 'background-2.jpg',
        id: 'image_2',
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        tooltip: 'Image 3',
        name: 'background-3.jpg',
        id: 'image_3',
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        tooltip: 'Image 4',
        name: 'background-4.jpg',
        id: 'image_4',
        src: 'images/virtual-background/background-4.jpg'
    }
];

const colors = [
    {
        tooltip: 'Black',
        code: 'black',
        id: 'black'
    },
    {
        tooltip: 'Blue',
        code: '#004A7F',
        id: 'blue'
    },
    {
        tooltip: 'Red',
        code: '#7F0000',
        id: 'red'
    },
    {
        tooltip: 'Green',
        code: '#007F0E',
        id: 'green'
    }
];

type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Renders room background dialog.
 *
 * @returns {ReactElement}
 */
function RoomBackground({ dispatch, t }: Props) {
    const [ selected, setSelected ] = useState('');

    const removeRoomBackground = () => {
        setSelected('none');
        dispatch(
            setBackgroundImage('', '')
        );
    };

    const addRoomImageBackground = image => {
        setSelected(image.id);
        dispatch(
            setBackgroundImage(image.src, '')
        );
    };

    const addRoomColorBackground = color => {
        setSelected(color.id);
        dispatch(
            setBackgroundImage('', color.code)
        );
    };

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { false }
            titleKey = { 'roomBackground.title' }
            width = 'small'>
            <div className = 'room-background-dialog'>
                <Tooltip
                    content = { t('roomBackground.removeBackground') }
                    position = { 'top' }>
                    <div
                        className = { selected === 'none' ? 'none-selected' : 'room-background-none' }
                        onClick = { () => removeRoomBackground() }>
                        None
                    </div>
                </Tooltip>
                {images.map((image, index) => (
                    <Tooltip
                        content = { image.tooltip }
                        key = { index }
                        position = { 'top' }>
                        <img
                            className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                            onClick = { () => addRoomImageBackground(image) }
                            onError = { event => event.target.style.display = 'none' }
                            src = { image.src } />
                    </Tooltip>
                ))};
            </div>
            <div className = 'room-background-dialog'>
                {colors.map((color, index) => (
                    <Tooltip
                        content = { color.tooltip }
                        key = { index }
                        position = { 'top' }>
                        <div
                            className = { selected === color.id ? 'thumbnail-color-selected' : 'thumbnail-color' }
                            onClick = { () => addRoomColorBackground(color) }
                            onError = { event => event.target.style.display = 'none' }
                            style = {{ backgroundColor: color.code }} />
                    </Tooltip>
                ))}

            </div>
        </Dialog>
    );
}

export default translate(connect()(RoomBackground));
