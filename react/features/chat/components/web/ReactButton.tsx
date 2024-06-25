import React, { useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";
import { IconFaceSmile } from "../../../base/icons/svg";
import Button from "../../../base/ui/components/web/Button";
import { BUTTON_TYPES } from "../../../base/ui/constants.any";
import { addReaction } from "../../actions.web";
import EmojiSelector from "./EmojiSelector";
import Popover from "../../../base/popover/components/Popover.web"; // Adjust the import path as needed

const useStyles = makeStyles()((theme) => ({
    reactButton: {
        padding: "2px",
        opacity: 0,
        transition: "opacity 0.3s ease",
        "&:hover": {
            backgroundColor: theme.palette.action03,
            opacity: 1,
        },
    },
    reactionPanel: {
        flexDirection: "row",
        position: "absolute",
        zIndex: 10,
        backgroundColor: theme.palette.ui02,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
    },
    reactionPanelContainer: {
        position: "relative",
        display: "inline-block",
    },
    popoverContainer: {
        position: "absolute",
        top: "100%", // Adjust this value to control the distance from the button
        left: "50%",
        transform: "translateX(-50%)",
    },
}));

const ReactButton = ({ participantID, className }) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const [showSmileysPanel, setShowSmileysPanel] = useState(false);
    const buttonRef = useRef(null);
    const { t } = useTranslation();

    const handleReactClick = useCallback(() => {
        setShowSmileysPanel(!showSmileysPanel);
    }, [showSmileysPanel]);

    const handleSmileySelect = useCallback(
        (smiley) => {
            if (smiley) {
                dispatch(addReaction(participantID, smiley));
            }
            setShowSmileysPanel(false);
        },
        [dispatch, participantID]
    );

    return (
        <div ref={buttonRef} className={cx(classes.reactionPanelContainer, className)}>
            <Button
                accessibilityLabel={t("toolbar.accessibilityLabel.react")}
                className={classes.reactButton}
                icon={IconFaceSmile}
                onClick={handleReactClick}
                type={BUTTON_TYPES.TERTIARY}
            />
            {showSmileysPanel && (
                <div className={classes.popoverContainer}>
                    <Popover
                        className={classes.reactionPanel}
                        content={<EmojiSelector onSmileySelect={handleSmileySelect} />}
                        disablePopover={false}
                        headingLabel={t("toolbar.react")}
                        id="emoji-selector-popover"
                        onPopoverClose={() => setShowSmileysPanel(false)}
                        onPopoverOpen={() => setShowSmileysPanel(true)}
                        position="top"
                        visible={showSmileysPanel}
                    >
                        <div />
                    </Popover>
                </div>
            )}
        </div>
    );
};

export default ReactButton;
