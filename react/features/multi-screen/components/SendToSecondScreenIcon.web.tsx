import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../base/environment/utils';
import { IconScreenshare } from '../../base/icons/svg';
import Button from '../../base/ui/components/web/Button';
import { useSendToSecondScreen } from '../hooks.web';
import { ISecondScreenSource } from '../types';

interface IProps {

    /**
     * Class name for the button's wrapper. Applied here rather than to a
     * container around this component so that a thumbnail that positions the
     * trigger itself does not lay out an empty box over its own corner on the
     * deployments where the feature is off and nothing renders.
     */
    className?: string;

    /**
     * What to show on the second screen.
     */
    source: ISecondScreenSource;

    /**
     * Whether the tile is hovered, i.e. whether to show the button at all.
     */
    visible: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        button: {
            padding: '3px !important',
            borderRadius: '4px',

            '& svg': {
                width: '18px',
                height: '18px'
            }
        }
    };
});

/**
 * The tile counterpart of {@link SendToSecondScreenButton}, for the thumbnails
 * that have no context menu to add an entry to (a screenshare, the shared
 * video). It sits where the menu trigger sits on the other thumbnails and, like
 * it, appears on hover.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement | null}
 */
const SendToSecondScreenIcon = ({ className, source, visible }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const { active, onClick, visible: enabled } = useSendToSecondScreen(source);

    // The thumbnails this sits on are themselves clickable (they pin), so the
    // click must not reach them.
    const _onClick = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        onClick();
    }, [ onClick ]);

    const _onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
        }
    }, []);

    // Stays put while its source is on a second screen, even once the pointer
    // leaves: it is the only way to take it off again, and a control that
    // vanishes on unhover would leave the tile with no sign that it is being
    // shown elsewhere.
    if (!enabled || (!visible && !active) || isMobileBrowser()) {
        return null;
    }

    return (
        <span
            className = { className }
            onKeyDown = { _onKeyDown }>
            <Button
                accessibilityLabel = {
                    t(active ? 'multiScreen.removeFromSecondScreen' : 'multiScreen.sendToSecondScreen') }
                className = { classes.button }
                icon = { IconScreenshare }
                onClick = { _onClick }
                size = 'small' />
        </span>
    );
};

export default SendToSecondScreenIcon;
