import React, { ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';

import DialogPortal from './DialogPortal';

interface IProps {

    /**
     * The component(s) to be displayed within the drawer portal.
     */
    children: ReactNode;

    /**
     * Class name used to add custom styles to the portal.
     */
    className?: string;
}

const useStyles = makeStyles()(theme => {
    return {
        portal: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 351,
            borderRadius: '16px 16px 0 0',

            '&.notification-portal': {
                zIndex: 901
            },

            '&::after': {
                content: '""',
                backgroundColor: theme.palette.ui01,
                marginBottom: 'env(safe-area-inset-bottom, 0)'
            }
        }
    };
});

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function JitsiPortal({ children, className }: IProps) {
    const { classes, cx } = useStyles();

    return (
        <DialogPortal className = { cx(classes.portal, className) }>
            { children }
        </DialogPortal>
    );
}

export default JitsiPortal;
