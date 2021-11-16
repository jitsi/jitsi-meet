// @flow

/* eslint-disable react/jsx-no-bind */

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { Icon, IconCheck, IconCopy } from '../../base/icons';
import { withPixelLineHeight } from '../styles/functions.web';
import { copyText } from '../util';


const styles = theme => {
    return {
        copyButton: {
            ...withPixelLineHeight(theme.typography.bodyLongRegular),
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 8px 8px 16px',
            marginTop: 5,
            width: 'calc(100% - 24px)',
            height: 24,

            background: theme.palette.action01,
            cursor: 'pointer',

            '&:hover': {
                backgroundColor: theme.palette.action01Hover,
                fontWeight: 600
            },

            '&.clicked': {
                background: theme.palette.success02
            },

            '& > div > svg > path': {
                fill: theme.palette.text01
            }
        },
        content: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 292,
            marginRight: 16,

            '&.selected': {
                fontWeight: 600
            }
        }
    };
};

let mounted;

type Props = {

    /**
     * An object containing the CSS classes.
     */
     classes: Object,

    /**
     * Css class to apply on container.
     */
    className: string,

    /**
     * The displayed text.
     */
    displayedText: string,

    /**
     * The text that needs to be copied (might differ from the displayedText).
     */
    textToCopy: string,

    /**
     * The text displayed on mouse hover.
     */
    textOnHover: string,

    /**
     * The text displayed on copy success.
     */
    textOnCopySuccess: string,

    /**
     * The id of the button.
     */
    id?: string,
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyButton({ classes, className, displayedText, textToCopy, textOnHover, textOnCopySuccess, id }: Props) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    useEffect(() => {
        mounted = true;

        return () => {
            mounted = false;
        };
    }, []);

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
                // avoid: Can't perform a React state update on an unmounted component
                if (mounted) {
                    setIsClicked(false);
                }
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
                    <div className = { clsx(classes.content, 'selected') }>
                        <span role = { 'alert' }>{ textOnCopySuccess }</span>
                    </div>
                    <Icon src = { IconCheck } />
                </>
            );
        }

        return (
            <>
                <div className = { `${classes.copyButton}-content` }>
                    { isHovered ? textOnHover : displayedText }
                </div>
                <Icon src = { IconCopy } />
            </>
        );
    }

    return (
        <div
            aria-label = { textOnHover }
            className = { clsx(className, classes.copyButton, isClicked ? ' clicked' : '') }
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

export default withStyles(styles)(CopyButton);
