import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { BUTTON_TYPES } from "../../../base/ui/constants";
import Button from "../../../base/ui/components/web/Button";
import { IState } from "../../../app/types";
import { makeStyles } from "tss-react/mui";
import { showNotification } from "../../../notifications/actions";
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
} from "../../../notifications/constants";
// @ts-ignore
import { convertPollsToText } from "./convertPollsToText";

const useStyles = makeStyles()((theme) => {
    return {
        buttonMargin: {
            marginTop: theme.spacing(2),
        },
    };
});

const PollsDownload = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { classes } = useStyles();
    const polls = useSelector(
        (state: IState) => state["features/polls"].polls
    );

    if (!Object.values(polls).length) {
        return null;
    }

    const onClick = () => {
        try {
            if (typeof APP !== "undefined") {
                APP.API.pollResultsDownloadRequested(convertPollsToText(polls));
            }
            dispatch(
                showNotification(
                    {
                        appearance: NOTIFICATION_TYPE.NORMAL,
                        titleKey: "polls.download.notification.title",
                    },
                    NOTIFICATION_TIMEOUT_TYPE.SHORT
                )
            );
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Button
            accessibilityLabel={t("polls.download.buttonText")}
            className={classes.buttonMargin}
            fullWidth={true}
            labelKey={"polls.download.buttonText"}
            type={BUTTON_TYPES.SECONDARY}
            onClick={onClick}
        />
    );
};

export default PollsDownload;
