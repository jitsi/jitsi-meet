import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { selectLang } from "../lang";
import { useRecoilState } from "recoil";
import { isVerify, LangState, CompleteVerify } from "../lib/atom";

const SignUpcheck = (props) => {
    const [{ email, password, wallet, discord }, setVerify] =
        useRecoilState(isVerify);
    const [comp, setComp] = useRecoilState(CompleteVerify);
    useEffect(() => {
        if (email && password && wallet && discord) {
            setComp(true);
        } else {
            setComp(false);
        }
    }, [email, password, wallet, discord, setComp]);
    return (
        <WWQ>
            <LeftCircle email={email} />
            <RightDash />
            <RightCircle password={password} />
            <LeftDash />
            <LeftCircle wallet={wallet} />
            <RightDash />
            <RightCircle discord={discord} />
            <LeftDash />
            <SignUpcircle comp={comp} />
        </WWQ>
    );
};

const WWQ = styled.div`
    display: flex;
    width: 20%;
    align-items: center;
    flex-direction: column;
`;
const RightDash = styled.div`
    color: #fff;
    transform: translateY(10%) rotate(-20deg);
    border-right: 8px dashed white;
    width: 4rem;
    height: 10rem;
`;

const LeftDash = styled.div`
    color: #fff;
    border-right: 8px dashed white;
    width: 4rem;
    height: 10rem;
    transform: translateY(-10%) rotate(20deg);
`;

const LeftCircle = styled.div`
    color: #fff;
    border-radius: 50%;
    border: 5px solid white;
    width: 4rem;
    height: 4rem;
    background-image: ${(props) =>
        props.wallet || props.email ? `url('/images/img/che.svg')` : ""};
    background-position: center;
    background-repeat: no-repeat;
    background-size: 5rem;
`;
const RightCircle = styled.div`
    color: #fff;
    border-radius: 50%;
    border: 5px solid white;
    width: 4rem;
    height: 4rem;
    margin-left: 6.4rem;
    background-image: ${(props) =>
        props.password || props.discord ? `url('/images/img/che.svg')` : ""};
    background-position: center;
    background-repeat: no-repeat;
    background-size: 5rem;
`;

const SignUpcircle = styled(LeftCircle)`
    background-image: ${(props) =>
        props.comp ? `url('/images/img/che.svg')` : ""};
`;

export default SignUpcheck;
