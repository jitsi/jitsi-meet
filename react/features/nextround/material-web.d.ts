/**
 * JSX typings for the @material/web custom elements we use.
 *
 * @material/web ships framework-agnostic web components with no React types, so
 * the tags have to be declared as intrinsic elements. React 19 renders custom
 * elements natively (properties for non-primitives, attributes for primitives),
 * so no wrapper components are needed.
 *
 * NOTE: tsconfig.web.json uses the classic `"jsx": "react"` transform and
 * @types/react declares JSX in the GLOBAL namespace — so this must augment
 * `global.JSX`, not `module 'react'`. Augmenting the react module instead
 * shadows the real IntrinsicElements and every intrinsic tag (div, span, …)
 * stops resolving.
 */
import type React from 'react';

type MdElement = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'md-filled-button': MdElement & {
                disabled?: boolean;
            };
            'md-text-button': MdElement & {
                disabled?: boolean;
            };
            'md-outlined-button': MdElement & {
                disabled?: boolean;
            };
            'md-icon-button': MdElement & {
                disabled?: boolean;
            };
            'md-outlined-text-field': MdElement & {
                disabled?: boolean;
                label?: string;
                placeholder?: string;
                value?: string;
            };
            'md-menu': MdElement & {
                anchor?: string;
                defaultFocus?: string;
                open?: boolean;
                positioning?: string;
            };
            'md-menu-item': MdElement & {
                disabled?: boolean;
            };
            'md-dialog': MdElement & {
                open?: boolean;
            };
            'md-list': MdElement;
            'md-list-item': MdElement & {
                disabled?: boolean;
                type?: string;
            };
        }
    }
}
