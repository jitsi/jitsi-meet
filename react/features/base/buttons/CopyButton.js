// @flow

import React, { useState } from 'react';

import { Icon, IconCheck, IconCopy } from '../../base/icons';
import { copyText } from '../util';


type Props = {

    /**
     * Css class to apply on container
     */
    className: string,

    /**
     * The displayed text
     */
    displayedText: string,

    /**
     * The text that needs to be copied (might differ from the displayedText)
     */
    textToCopy: string,

    /**
     * The text displayed on mouse hover
     */
    textOnHover: string,

    /**
     * The text displayed on copy success
     */
    textOnCopySuccess: string,

    /**
     * The id of the button
     */
    id?: string,
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyButton({ className, displayedText, textToCopy, textOnHover, textOnCopySuccess, id }: Props) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    async function onClick() {
        setIsHovered(false);

        const isCopied = await copyText(textToCopy);

        if (isCopied) {
            setIsClicked(true);

            setTimeout(() => {
                setIsClicked(false);
            }, 2500);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverIn() {
        if (!isClicked) {
            setIsHovered(true);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverOut() {
        setIsHovered(false);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {React.KeyboardEventHandler<HTMLDivElement>} e - The key event to handle.
     *
     * @returns {void}
     */
    function onKeyPress(e) {
        if (onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick();
        }
    }

    /**
     * Renders the content of the link based on the state.
     *
     * @returns {React$Element<any>}
     */
    function renderContent() {
        if (isClicked) {
            return (
                <>
                    <div className = 'copy-button-content selected'>
                        <span role = { 'alert' }>{ textOnCopySuccess }</span>
                    </div>
                    <Icon src = { IconCheck } />
                </>
            );
        }

        return (
            <>
                <div className = 'copy-button-content'>
                    {isHovered ? textOnHover : displayedText}
                </div>
                <Icon src = { IconCopy } />
            </>
        );
    }

    return (
        <div
            aria-label = { textOnHover }
            className = { `${className} copy-button${isClicked ? ' clicked' : ''}` }
            id = { id }
            onBlur = { onHoverOut }
            onClick = { onClick }
            onFocus = { onHoverIn }
            onKeyPress = { onKeyPress }
            onMouseOut = { onHoverOut }
            onMouseOver = { onHoverIn }
            role = 'button'
            tabIndex = { 0 }>
            { renderContent() }
        </div>
    );
}

CopyButton.defaultProps = {
    className: ''
};

export default CopyButton;
