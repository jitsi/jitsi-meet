// @flow

import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

type Props = {

    /**
     * The component(s) to be displayed within the drawer portal.
     */
    children: React$Node,

    /**
     * Custom class name to apply on the container div.
     */
    className?: string,

    /**
     * Function used to get the refferrence to the container div.
     */
    getRef?: Function,

    /**
     * Function used to get the updated size info of the container on it's resize.
     */
    setSize?: Function,

    /**
     * Custom style to apply to the container div.
     */
    style?: Object,
};

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function DialogPortal({ children, className, style, getRef, setSize }: Props) {
    const [ portalTarget ] = useState(() => {
        const portalDiv = document.createElement('div');

        portalDiv.style.visibility = 'hidden';

        return portalDiv;
    });
    const timerRef = useRef();

    useEffect(() => {
        if (style) {
            for (const styleProp of Object.keys(style)) {
                // https://github.com/facebook/flow/issues/3733
                const objStyle: Object = portalTarget.style;

                objStyle[styleProp] = style[styleProp];
            }
        }
        if (className) {
            portalTarget.className = className;
        }
    }, [ style, className ]);

    useEffect(() => {
        if (portalTarget && getRef) {
            getRef(portalTarget);
        }
    }, [ portalTarget ]);

    useEffect(() => {
        const size = {
            width: 1,
            height: 1
        };
        const observer = new ResizeObserver(entries => {
            const { contentRect } = entries[0];

            if (contentRect.width !== size.width || contentRect.height !== size.height) {
                setSize && setSize(contentRect);
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    portalTarget.style.visibility = 'visible';
                }, 100);
            }
        });

        if (document.body) {
            document.body.appendChild(portalTarget);
            observer.observe(portalTarget);
        }

        return () => {
            observer.unobserve(portalTarget);
            if (document.body) {
                document.body.removeChild(portalTarget);
            }
        };
    }, []);

    return ReactDOM.createPortal(
      children,
      portalTarget
    );
}

export default DialogPortal;
