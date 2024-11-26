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
import { downloadText } from "../../../base/util/downloadText";
import { getConferenceName } from "../../../base/conference/functions";
import { getLocalizedDateFormatter } from "../../../base/i18n/dateUtil";
import { getPolls } from "../../functions";

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
    const polls = useSelector(getPolls());

    const roomName = useSelector((state: IState) => getConferenceName(state));

    if (!polls.length) {
        return null;
    }

    const onClick = () => {
        try {
            const pollsText = convertPollsToText(polls, t);
            const now = Date.now()
            const date = `${getLocalizedDateFormatter(now).format('DD MM YYYY hh:mm:ss')}`
            downloadText(pollsText, `${t("polls.download.fileName", {date, roomName})}.txt`);
            if (typeof APP !== "undefined") {
                APP.API.pollResultsDownloadRequested(pollsText);
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
