import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilState } from "recoil";
import styled from "styled-components";
import { MediaButton } from "../welcome/Common";
import { selectLang } from "./lang";
import { isShown, LangState, PubKey } from "./lib/atom";
import cookies from "react-cookies";

const Header = (props) => {
    const expires = new Date();
    // const { lang, setLang } = props;
    const [lang, setLang] = useRecoilState(LangState);
    const [visible, setVisible] = useRecoilState(isShown);
    const [pubkey, setPubkey] = useRecoilState(PubKey);
    const { StartMeeting } = selectLang(lang);
    const { solana } = window;
    const language = () => {
        setLang(lang === "KR" ? "EN" : "KR");
    };

    const history = useHistory();
    const meeting = async () => {
        // if (solana) {
        //     const response = await solana.connect();
        //     console.log(response.ValidatorInfo);
        //     console.log(response.publicKey.toString());
        // } else {
        //     alert("Solana object not found! Get a Phantom Wallet 👻");
        // }

        // history.push({
        //     pathname: `/meeting`,
        // });

        setVisible((prev) => !prev);
    };

    const getBalance = async () => {
        if (window.screen.width > 500) {
            const [account] = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            if (account) {
                setPubkey(account);
                expires.setFullYear(expires.getFullYear() + 10);
                cookies.save("pubkey", account, {
                    path: "/", // 쿠키 값을 저장하는 서버 경로
                    expires, // 유효 시간
                });
                if (
                    history.location.pathname !== "/profile" ||
                    history.location.pathname === "/"
                ) {
                    history.push({
                        pathname: `/profile`,
                    });
                } else {
                    history.push({
                        pathname: `/test`,
                    });
                }
            }
        } else {
            if (address) {
                setPubkey(address);
                expires.setFullYear(expires.getFullYear() + 10);
                cookies.save("pubkey", address, {
                    path: "/", // 쿠키 값을 저장하는 서버 경로
                    expires, // 유효 시간
                });
                history.push({
                    pathname: `/profile`,
                });
            }
        }
    };
    return (
        <FirstHeaderLayout>
            <HeaderLayout>
                <HeaderDiv>
                    <HeaderTitle>
                        <img
                            src="/images/NXDF_welcome_logo.png"
                            width="180px"
                            height="30px"
                        />
                    </HeaderTitle>
                </HeaderDiv>
                <HeaderDiv2>
                    <Headerlang onClick={language}>{lang} |</Headerlang>
                    <HeaderBtn onClick={getBalance}>
                        <img
                            src="/images/video.svg"
                            width="20px"
                            height="20px"
                        />
                        <span>{StartMeeting}</span>
                    </HeaderBtn>
                </HeaderDiv2>
            </HeaderLayout>
        </FirstHeaderLayout>
    );
};

const FirstHeaderLayout = styled.div`
    width: 100%;
    background-color: white;
    height: 5vh;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;

    @media (max-width: 768px) {
        height: auto;
    }
    @media (max-width: 1280px) and (orientation: landscape) {
        height: auto;
    }
`;

const HeaderLayout = styled.div`
    width: 60%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

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

const Headerlang = styled.span`
    display: inline-block;
    margin: 0.5rem;
    color: black;
    font-size: 1.5rem;
    text-align: center;
    width: 15%;
    @media (max-width: 768px) {
        width: 40%;
        height: 40%;
        font-size: 1rem;
    }
    @media (min-width: 768px) and (max-width: 1280px) {
        width: 25%;
        height: 40%;
    }
`;

const HeaderDiv = styled.div`
    width: 50%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;
const HeaderDiv2 = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const HeaderTitle = styled.div`
    background-size: contain;
    width: 50%;
    min-width: 120px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    img {
        margin: 0.5rem 0px;
        @media (max-width: 768px) {
            width: 120px;
            height: 20px;
        }
    }
    @media (max-width: 768px) {
        align-items: center;
        justify-content: center;
        width: auto;
        height: 50%;
    }
`;

const HeaderNav = styled.div`
    width: 50%;
    height: 100%;
    color: #000000;
`;

const HeaderNavinner = styled.div`
    height: 100%;
`;

const HeaderNavTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    span {
        display: inline-block;
        border-bottom: 2px solid black;
    }
`;

export default Header;
