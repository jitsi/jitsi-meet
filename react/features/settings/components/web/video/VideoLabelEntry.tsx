import React, { useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import Icon from "../../../../base/icons/components/Icon";
import { IconCheck, IconExclamationSolid } from "../../../../base/icons/svg";
import ContextMenuItem from "../../../../base/ui/components/web/ContextMenuItem";
import { TEXT_OVERFLOW_TYPES } from "../../../../base/ui/constants.any";

interface IProps {
    /**
     * The text for this component.
     */
    children: string;

    /**
     * Flag indicating if there is a problem with the device.
     */
    hasError?: boolean;

    /**
     * Flag indicating if there is a problem with the device.
     */
    index?: number;

    /**
     * Flag indicating the selection state.
     */
    isSelected: boolean;

    /**
     * The id for the label, that contains the item text.
     */
    labelId?: string;

    /**
     * The length of the microphone list.
     */
    length: number;

    /**
     * Click handler for component.
     */
    onClick: Function;

    overflowType: TEXT_OVERFLOW_TYPES;
}

const useStyles = makeStyles()((theme) => {
    return {
        container: {
            position: "relative",
        },

        previewEntry: {
            cursor: "pointer",
            width: "100%",
            height: "36px",
            position: "relative",
            marginBottom: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
            boxSizing: "border-box",

            "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
            },
        },

        selectedEntry: {
            width: "100%",
            height: "36px",
            position: "relative",
            marginBottom: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
            backgroundColor: "white",
            color: "black",
            display: "inline-block",
        },

        entryText: {
            maxWidth: "238px",

            "&.withMeter": {
                maxWidth: "178px",
            },

            "&.left-margin": {
                marginLeft: "36px",
            },
        },

        icon: {
            borderRadius: "50%",
            display: "inline-block",
            width: "14px",
            marginLeft: "6px",

            "& svg": {
                fill: theme.palette.iconError,
            },
        },
    };
});

const VideoLabelEntry = ({
    children,
    hasError,
    index,
    isSelected,
    length,
    onClick: propsClick,
    overflowType = TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER,
}: IProps) => {
    const { classes, cx } = useStyles();

    /**
     * Click handler for the entry.
     *
     * @returns {void}
     */
    const onClick = useCallback(() => {
        propsClick();
    }, [propsClick]);

    /**
     * Key pressed handler for the entry.
     *
     * @param {Object} e - The event.
     * @private
     *
     * @returns {void}
     */
    const onKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                propsClick();
            }
        },
        [propsClick]
    );

    return (
        <div
            aria-checked={isSelected}
            aria-posinset={index}
            aria-setsize={length}
            onClick={onClick}
            onKeyPress={onKeyPress}
            role="radio"
            tabIndex={0}
        >
            <ContextMenuItem
                accessibilityLabel={children}
                icon={isSelected ? IconCheck : undefined}
                overflowType={overflowType}
                selected={isSelected}
                text={children}
                textClassName={cx(classes.entryText, !isSelected && "left-margin")}
            >
                {hasError && <Icon className={classes.icon} size={16} src={IconExclamationSolid} />}
            </ContextMenuItem>
        </div>
    );
};

export default VideoLabelEntry;
