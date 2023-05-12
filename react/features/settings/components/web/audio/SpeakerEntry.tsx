import React, { useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconCheck } from '../../../../base/icons/svg';
import Button from '../../../../base/ui/components/web/Button';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import { BUTTON_TYPES, TEXT_OVERFLOW_TYPES } from '../../../../base/ui/constants.any';
import logger from '../../../logger';

const TEST_SOUND_PATH = 'sounds/ring.mp3';

/**
 * The type of the React {@code Component} props of {@link SpeakerEntry}.
 */
interface IProps {

    /**
     * The text label for the entry.
     */
    children: string;

    /**
     * The deviceId of the speaker.
     */
    deviceId: string;

    /**
     * Flag controlling the selection state of the entry.
     */
    index: number;

    /**
     * Flag controlling the selection state of the entry.
     */
    isSelected: boolean;

    /**
     * Flag controlling the selection state of the entry.
     */
    length: number;

    /**
     * Click handler for the component.
     */
    onClick: Function;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            position: 'relative',

            [[ '&:hover', '&:focus', '&:focus-within' ] as any]: {
                '& .entryText': {
                    maxWidth: '178px',
                    marginRight: 0
                },

                '& .testButton': {
                    display: 'inline-block'
                }
            }
        },

        entryText: {
            maxWidth: '238px',

            '&.left-margin': {
                marginLeft: '36px'
            }
        },

        testButton: {
            display: 'none',
            padding: '4px 10px',
            position: 'absolute',
            right: '16px',
            top: '6px'
        }
    };
});

/**
 * Implements a React {@link Component} which displays an audio
 * output settings entry. The user can click and play a test sound.
 *
 * @param {IProps} props - Component props.
 * @returns {JSX.Element}
 */
const SpeakerEntry = (props: IProps) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { classes, cx } = useStyles();

    /**
     * Click handler for the entry.
     *
     * @returns {void}
     */
    function _onClick() {
        props.onClick(props.deviceId);
    }

    /**
     * Key pressed handler for the entry.
     *
     * @param {Object} e - The event.
     * @private
     *
     * @returns {void}
     */
    function _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            props.onClick(props.deviceId);
        }
    }

    /**
     * Click handler for Test button.
     * Sets the current audio output id and plays a sound.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    async function _onTestButtonClick(e: React.KeyboardEvent | React.MouseEvent) {
        e.stopPropagation();

        try {
            await audioRef.current?.setSinkId(props.deviceId);
            audioRef.current?.play();
        } catch (err) {
            logger.log('Could not set sink id', err);
        }
    }

    const { children, isSelected, index, length } = props;

    /* eslint-disable react/jsx-no-bind */
    return (
        <li
            aria-checked = { isSelected }
            aria-posinset = { index }
            aria-setsize = { length }
            className = { classes.container }
            onClick = { _onClick }
            onKeyPress = { _onKeyPress }
            role = 'radio'
            tabIndex = { 0 }>
            <ContextMenuItem
                accessibilityLabel = { children }
                icon = { isSelected ? IconCheck : undefined }
                overflowType = { TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER }
                selected = { isSelected }
                text = { children }
                textClassName = { cx(classes.entryText, 'entryText', !isSelected && 'left-margin') }>
                <Button
                    className = { cx(classes.testButton, 'testButton') }
                    label = 'Test'
                    onClick = { _onTestButtonClick }
                    onKeyPress = { _onTestButtonClick }
                    type = { BUTTON_TYPES.SECONDARY } />
            </ContextMenuItem>
            <audio
                preload = 'auto'
                ref = { audioRef }
                src = { TEST_SOUND_PATH } />
        </li>
    );
};


export default SpeakerEntry;
