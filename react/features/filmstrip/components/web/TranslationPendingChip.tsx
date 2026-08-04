import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { getTranslationDeliveryPendingCount } from '../../../audio-translation/functions';
import { THUMBNAIL_TYPE } from '../../constants';

/**
 * Amber, deliberately not the dominant-speaker blue.
 */
const PENDING_COLOR = '#F8AE1A';

interface IProps {

    /**
     * The speaker whose translated audio is still being delivered.
     */
    participantId: string;

    /**
     * The type of thumbnail; drives the compact (count-only) form.
     */
    thumbnailType?: string;
}

const useStyles = makeStyles()(() => {
    const breathe = keyframes`
        0% { opacity: 0.45; }
        50% { opacity: 1; }
        100% { opacity: 0.45; }
    `;

    return {
        chip: {
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            border: `1px solid ${PENDING_COLOR}`,
            borderRadius: '12px',
            color: '#FFD98A',
            display: 'flex',
            gap: '4px',
            padding: '2px 6px',
            pointerEvents: 'none' as const,
            position: 'absolute' as const,
            right: '4px',
            top: '4px',
            whiteSpace: 'nowrap' as const,
            zIndex: 12
        },

        compact: {
            fontSize: '9px',
            lineHeight: '12px'
        },

        dot: {
            animation: `${breathe} 1.6s ease-in-out infinite`,
            backgroundColor: PENDING_COLOR,
            borderRadius: '50%',
            flexShrink: 0,
            height: '8px',
            width: '8px',

            '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                opacity: 0.85
            }
        },

        label: {
            fontSize: '10px',
            lineHeight: '13px'
        }
    };
});

/**
 * Corner chip counting the participants still hearing this speaker's translated audio. Renders nothing when
 * no count was published (the ring alone still signals the wait).
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement|null}
 */
const TranslationPendingChip = ({ participantId, thumbnailType }: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const count = useSelector((state: IReduxState) =>
        getTranslationDeliveryPendingCount(state, participantId));

    if (count < 1) {
        return null;
    }

    const isCompact = thumbnailType !== THUMBNAIL_TYPE.TILE;
    const label = t('videothumbnail.translationStillListening', { count });

    return (
        <div
            aria-label = { label }
            className = { cx(classes.chip, isCompact && classes.compact) }
            title = { label }>
            <span className = { classes.dot } />
            <span className = { classes.label }>
                { isCompact ? count : label }
            </span>
        </div>
    );
};

export default TranslationPendingChip;
