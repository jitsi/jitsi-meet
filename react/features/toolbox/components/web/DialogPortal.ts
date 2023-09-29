import { ReactNode, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { ZINDEX_DIALOG_PORTAL } from '../../constants';

interface IProps {

    /**
     * The component(s) to be displayed within the drawer portal.
     */
    children: ReactNode;

    /**
     * Custom class name to apply on the container div.
     */
    className?: string;

    /**
     * Function used to get the reference to the container div.
     */
    getRef?: Function;

    /**
     * Function called when the portal target becomes actually visible.
     */
    onVisible?: Function;

    /**
     * Function used to get the updated size info of the container on it's resize.
     */
    setSize?: Function;

    /**
     * Custom style to apply to the container div.
     */
    style?: any;

    /**
     * The selector for the element we consider the content container.
     * This is used to determine the correct size of the portal content.
     */
    targetSelector?: string;
}

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function DialogPortal({ children, className, style, getRef, setSize, targetSelector, onVisible }: IProps) {
    const clientWidth = useSelector((state: IReduxState) => state['features/base/responsive-ui'].clientWidth);
    const [ portalTarget ] = useState(() => {
        const portalDiv = document.createElement('div');

        portalDiv.style.visibility = 'hidden';

        return portalDiv;
    });
    const timerRef = useRef<number>();

    useEffect(() => {
        if (style) {
            for (const styleProp of Object.keys(style)) {
                const objStyle: any = portalTarget.style;

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
            portalTarget.style.zIndex = `${ZINDEX_DIALOG_PORTAL}`;
        }
    }, [ portalTarget, getRef ]);

    useEffect(() => {
        const size = {
            width: 1,
            height: 1
        };
        const observer = new ResizeObserver(entries => {
            const { contentRect } = entries[0];

            if (contentRect.width !== size.width || contentRect.height !== size.height) {
                setSize?.(contentRect);
                clearTimeout(timerRef.current);
                timerRef.current = window.setTimeout(() => {
                    portalTarget.style.visibility = 'visible';
                    onVisible?.();
                }, 100);
            }
        });

        const target = targetSelector ? portalTarget.querySelector(targetSelector) : portalTarget;

        if (document.body) {
            document.body.appendChild(portalTarget);
            observer.observe(target ?? portalTarget);
        }

        return () => {
            observer.unobserve(target ?? portalTarget);
            if (document.body) {
                document.body.removeChild(portalTarget);
            }
        };
    }, [ clientWidth ]);

    return ReactDOM.createPortal(
        children,
        portalTarget
    );
}

export default DialogPortal;
