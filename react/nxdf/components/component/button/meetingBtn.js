import React, { useState } from "react";
import styled from "styled-components";
import { selectLang } from "../lang";
import { useRecoilState } from "recoil";
import { LangState } from "../lib/atom";

/*
 * Replace the elements below with your own.
 *
 * Note: The corresponding styles are in the ./index.styled-components file.
 */
const MeetingBtn = (props) => {
    const [lang, setLang] = useRecoilState(LangState);
    const { StartMeeting } = selectLang(lang);

    return (
        <HeaderBtn onClick={meeting}>
            <img src="/images/video.svg" width="20px" height="20px" />
            <span>{StartMeeting}</span>
        </HeaderBtn>
    );
};
const HeaderBtn = styled(MediaButton)`
    margin: 0.5rem 0px;
    @media (max-width: 768px) {
        width: 40%;
        height: 100%;
        span {
            display: none;
        }
        img {
            margin: 0;
        }
    }
`;

export default MeetingBtn;
