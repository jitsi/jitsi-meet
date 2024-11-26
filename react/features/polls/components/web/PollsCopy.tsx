import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { BUTTON_TYPES } from "../../../base/ui/constants";
import Button from "../../../base/ui/components/web/Button";
import { IState } from "../../../app/types";
import { copyText } from "../../../base/util/copyText";
import { makeStyles } from "tss-react/mui";
import { showNotification } from "../../../notifications/actions";
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
} from "../../../notifications/constants";

// @ts-ignore
import {convertPollsToText} from './convertPollsToText'
import { getPolls } from "../../functions";

const useStyles = makeStyles()((theme) => {
    return {
        buttonMargin: {
            marginTop: theme.spacing(2),
        },
    };
});

const PollsCopy = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { classes } = useStyles();
    const polls = useSelector(getPolls());


    if (!polls.length) {
      return null;
    }

    const onClick = () => {
        try {
            copyText(convertPollsToText(polls, t));
            dispatch(
                showNotification(
                    {
                        appearance: NOTIFICATION_TYPE.NORMAL,
                        titleKey: "polls.copy.notification.title",
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
            accessibilityLabel={t("polls.copy.buttonText")}
            className={classes.buttonMargin}
            fullWidth={true}
            labelKey={"polls.copy.buttonText"}
            type={BUTTON_TYPES.SECONDARY}
            onClick={onClick}
        />
    );
};

export default PollsCopy;
