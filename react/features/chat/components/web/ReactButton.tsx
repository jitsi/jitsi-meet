import { Theme } from '@mui/material';
import React, { useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";
import { IconFaceSmile } from "../../../base/icons/svg";
import Button from "../../../base/ui/components/web/Button";
import { BUTTON_TYPES } from "../../../base/ui/constants.any";
import { sendReaction } from "../../actions.any";
import EmojiSelector from "./EmojiSelector";
import Popover from "../../../base/popover/components/Popover.web"; // Adjust the import path as needed
import { IChatProps as AbstractProps } from '../../types';

interface IProps extends AbstractProps {

    /**
     * Function to send a reaction to a message.
     *
     * @protected
     */
    _onSendReaction: Function;

    reaction: string;

    messageID: string;

    receiverID: string;

}

const useStyles = makeStyles()((theme: Theme) => ({
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

const ReactButton = ({
    reaction,
    message,
    messageID,
    receiverID,
}: IProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch(); 

    /**
     * Sends a reaction to a message.
     *
     * @param {string} reaction - The reaction to send.
     * @param {string} messageID - The message ID to react to.
     * @param {string} receiverID - The receiver ID of the reaction.
     * @returns {Function}
     */
    const onSendReaction = useCallback((reaction: string, messageID: string, receiverID?: string) => {
        dispatch(sendReaction(reaction, messageID, receiverID));
    }, []);

    const [showSmileysPanel, setShowSmileysPanel] = useState(false);

    const buttonRef = useRef(null);

    const handleReactClick = useCallback(() => {
        setShowSmileysPanel(!showSmileysPanel);
    }, [showSmileysPanel]);


    return (
        <div 
            ref={buttonRef} 
            className={ classes.reactionPanelContainer }>
            <Button
                accessibilityLabel={("toolbar.accessibilityLabel.react")}
                className={classes.reactButton}
                icon={IconFaceSmile}
                onClick={handleReactClick}
                type={BUTTON_TYPES.TERTIARY}
            />
            {showSmileysPanel && (
                <div className={classes.popoverContainer}>
                    <Popover
                        className={classes.reactionPanel}
                        content={<EmojiSelector onSelect={(emoji) => onSendReaction(emoji, "test")} />}
                        disablePopover={false}
                        headingLabel={("toolbar.react")}
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
    
}
// onClick = { () => onSendReaction('like', message.messageId, message.id)} 

export default ReactButton;
