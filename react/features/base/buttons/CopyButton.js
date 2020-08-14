// @flow

import React, { useState } from 'react';

import { translate } from '../../base/i18n';
import { Icon, IconCheck, IconCopy } from '../../base/icons';
import { copyText } from '../../base/util';


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
    textOnCopySuccess: string
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyButton({ className, displayedText, textToCopy, textOnHover, textOnCopySuccess }: Props) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    function onClick() {
        setIsHovered(false);
        if (copyText(textToCopy)) {
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
     * Renders the content of the link based on the state.
     *
     * @returns {React$Element<any>}
     */
    function renderContent() {
        if (isClicked) {
            return (
                <>
                    <div className = 'copy-button-content selected'>
                        {textOnCopySuccess}
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
            className = { `${className} copy-button${isClicked ? ' clicked' : ''}` }
            onClick = { onClick }
            onMouseOut = { onHoverOut }
            onMouseOver = { onHoverIn }>
            { renderContent() }
        </div>
    );
}

CopyButton.defaultProps = {
    className: ''
};

export default translate(CopyButton);
