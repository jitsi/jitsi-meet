import React, { ReactNode, useRef } from 'react';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { TEXT_OVERFLOW_TYPES } from '../../constants.web';

interface ITextWithOverflowProps {
  children: ReactNode;
  className?: string;
  overflowType?: TEXT_OVERFLOW_TYPES;
}

const useStyles = makeStyles<{ translateDiff: number; }>()((_, { translateDiff }) => {
    return {
        animation: {
            '&:hover': {
                animation: `${keyframes`
                    0%, 20% {
                        transform: translateX(0%);
                        left: 0%;
                    }
                    80%, 100% {
                        transform: translateX(-${translateDiff}px);
                        left: 100%;
                    }
                `} ${Math.max(translateDiff * 50, 2000)}ms infinite alternate linear;`
            }
        },
        textContainer: {
            overflow: 'hidden'
        },
        [TEXT_OVERFLOW_TYPES.ELLIPSIS]: {
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        [TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER]: {
            display: 'inline-block',
            overflow: 'visible',
            whiteSpace: 'nowrap'
        }
    };
});

const TextWithOverflow = ({
    className,
    overflowType = TEXT_OVERFLOW_TYPES.ELLIPSIS,
    children
}: ITextWithOverflowProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLSpanElement>(null);
    const shouldAnimateOnHover = overflowType === TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER
        && containerRef.current
        && contentRef.current
        && containerRef.current.clientWidth < contentRef.current.clientWidth;

    const translateDiff = shouldAnimateOnHover ? contentRef.current.clientWidth - containerRef.current.clientWidth : 0;
    const { classes: styles, cx } = useStyles({ translateDiff });

    return (
        <div
            className = { cx(className, styles.textContainer) }
            ref = { containerRef }>
            <span
                className = { cx(styles[overflowType], shouldAnimateOnHover && styles.animation) }
                ref = { contentRef }>
                {children}
            </span>
        </div>
    );
};

export default TextWithOverflow;
