import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

interface IProps {

    /**
     * The target language code, or null for the "off" option.
     */
    code: string | null;

    /**
     * The label to display.
     */
    label: string;

    /**
     * Called with this item's code when it is selected.
     */
    onSelect: (code: string | null) => void;

    /**
     * Whether this item is the currently-selected option.
     */
    selected: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        item: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            fontSize: '0.875rem',
            color: theme.palette.text01,
            borderRadius: `${theme.shape.borderRadius}px`,
            '&:hover': {
                backgroundColor: theme.palette.ui02
            }
        },
        selected: {
            fontWeight: 700,
            color: theme.palette.link01
        }
    };
});

/**
 * A single selectable language row in the audio-translation dialog.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioTranslationLanguageItem = ({ code, label, onSelect, selected }: IProps) => {
    const { classes: styles, cx } = useStyles();
    const onClick = useCallback(() => onSelect(code), [ code, onSelect ]);

    return (
        <button
            className = { cx(styles.item, selected && styles.selected) }
            onClick = { onClick }
            type = 'button'>
            { label }
        </button>
    );
};

export default AudioTranslationLanguageItem;
