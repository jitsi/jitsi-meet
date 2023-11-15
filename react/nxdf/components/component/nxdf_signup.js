import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilState } from "recoil";
import styled from "styled-components";
import SignUpcheck from "./button/signupcheck";
import { selectLang } from "./lang";
import { isShown, isVerify } from "./lib/atom";
import { media } from "./lib/media";
import Register from "./Register";
import { useForm } from "react-hook-form";
import { verifyemail, verifypass } from "./lib/verify";

const SignUp = (props) => {
    const [visible, setVisible] = useRecoilState(isShown);
    const [verify, setVerify] = useRecoilState(isVerify);
    const [pubkey, setPubkey] = useState("");
    const onClick = (data) => {
        if (data.target.id === "exit") setVisible(false);
    };
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();
    const { email, password, wallet, discord } = watch();
    useEffect(() => {
        if (email && !errors.email) {
            let verifyEmail = verifyemail(email);
            if (verifyEmail) {
                setVerify(({ ...prev }) => ({ ...prev, email: true }));
            } else {
                setVerify(({ ...prev }) => ({ ...prev, email: false }));
            }
        }
        if (pubkey !== "" && !errors.wallet) {
            setVerify(({ ...prev }) => ({ ...prev, wallet: true }));
        } else {
            setVerify(({ ...prev }) => ({ ...prev, wallet: false }));
        }
        if (password && !errors.password) {
            let verifyPass = verifypass(password);
            if (verifyPass) {
                setVerify(({ ...prev }) => ({ ...prev, password: true }));
            } else {
                setVerify(({ ...prev }) => ({ ...prev, password: false }));
            }
        }
        if (discord && !errors.discord) {
            setVerify(({ ...prev }) => ({ ...prev, discord: true }));
        } else {
            setVerify(({ ...prev }) => ({ ...prev, discord: false }));
        }
        console.log(verify);
    }, [email, wallet, pubkey, password, discord, setVerify]);

    const onSubmit = (data) => console.log(data);
    const ConnectWallet = async () => {
        if (solana) {
            const response = await solana.connect();
            setPubkey(response.publicKey.toString());
        } else {
            alert("Solana object not found! Get a Phantom Wallet 👻");
        }
    };
    return (
        <SignUpBackground id="exit" visible={visible} onClick={onClick}>
            <Register>
                <SignUpHeader>
                    <ExitWrapper>
                        <img
                            id="exit"
                            src="/images/img/nav-close.png"
                            onClick={onClick}
                        />
                    </ExitWrapper>
                    <SignHeaderContent>
                        {/* <h1>Sign Up</h1>
                        <span>Welcome To NXDF-Meet</span> */}
                    </SignHeaderContent>
                </SignUpHeader>
                <SignupLayout>
                    <SignUpcheck />
                    <SignUpForm onSubmit={handleSubmit(onSubmit)}>
                        <FormContent>
                            {errors.email?.type === "pattern" && (
                                <span>이메일 형식이 맞지 않습니다</span>
                            )}
                            {errors.email?.type === "required" && (
                                <span>This field is required</span>
                            )}
                            <span>이메일을 입력해주세요.</span>
                            <FormInputSub
                                type="input"
                                onChange={() => onchange}
                                {...register("email", {
                                    required: true,
                                    pattern:
                                        /^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                                })}
                            />
                        </FormContent>
                        <FormContent>
                            {errors.password?.type === "pattern" && (
                                <span>비밀번호 형식이 맞지 않습니다</span>
                            )}
                            {errors.password?.type === "required" && (
                                <span>This field is required</span>
                            )}
                            <span>비밀번호를 입력해주세요</span>
                            <FormInputSub
                                type="password"
                                {...register("password", {
                                    required: true,
                                    pattern:
                                        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                                })}
                            />
                        </FormContent>
                        <FormContent>
                            {errors.wallet && (
                                <span>This field is required</span>
                            )}
                            <span>블록체인 지갑을 연동해주세요</span>
                            <FormBtn
                                type="button"
                                onClick={ConnectWallet}
                                {...register("wallet", {
                                    required: true,
                                    value: pubkey,
                                })}
                                value={pubkey ? pubkey : "ConnectWallet"}
                            />
                        </FormContent>
                        <FormContent>
                            {errors.discord && (
                                <span>This field is required</span>
                            )}
                            <span>디스코드 계정을 연동해주세요</span>
                            <FormInput
                                {...register("discord", {
                                    required: true,
                                })}
                            />
                        </FormContent>
                        <FormContent>
                            <FormSubmit value="Sign Up" type="submit" />
                        </FormContent>
                    </SignUpForm>
                </SignupLayout>
            </Register>
        </SignUpBackground>
    );
};

const FormInput = styled.input`
    margin-top: 1rem;
    background: #ffffff;
    box-shadow: inset 0px 4px 4px rgb(0 0 0 / 25%);
    border-radius: 8px;
    height: 3rem;
    width: 80%;
    padding-left: 1rem;
`;

const FormBtn = styled(FormInput)`
    color: black !important;
    font-size: 1rem;
    font-weight: 700;
    background: rgb(255, 245, 0);
`;

const FormInputSub = styled(FormInput)`
    margin-bottom: 5rem;
`;

const FormSubmit = styled.input`
    background: #fff500;
    box-shadow: 0px 4px 4px rgb(0 0 0 / 25%);
    border-radius: 1rem;
    width: 80%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
    height: 3.5rem;
    color: #000000 !important;
    cursor: pointer;
    font-weight: 700;
    font-size: 1.5rem;
`;

const ExitWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    font-size: 1.5rem;
    padding: 1rem;
    img {
        margin-right: 1rem;
        cursor: pointer;
    }
`;
const SignUpForm = styled.form`
    width: 80%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`;

const FormContent = styled.div`
    width: 100%;
    height: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    span {
        width: 80%;
        display: inline-block;
        font-size: 1rem;
        text-align: left;
    }
`;

const SignUpBackground = styled.div`
    width: 100%;
    height: 100%;
    display: ${(props) => (props.visible ? "flex" : "none")};
    position: absolute;
    align-items: center;
    justify-content: center;
    top: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 300;
    overflow: auto;
`;

const SignHeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    h1 {
        color: white;
    }
`;

const KAKA = styled.div`
    background: linear-gradient(123.07deg, #0e185d -69.3%, #3f65c6 69.72%);
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 59px;
    margin-top: 1rem;
    padding: 1rem;
    width: 80%;
    justify-content: center;

    height: 3.5rem;
    display: flex;
    align-items: center;
    color: #ffffff;
    font-weight: 700;
`;

const SignupLayout = styled.div`
    width: 100%;
    height: 80%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
`;

const SignUpHeader = styled.div`
    width: 100%;
    height: 20%;
    min-height: 300px;
    background-image: url("/images/img/signup/top.png");
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    flex-direction: column;
    display: flex;
    align-items: center;
`;

export default SignUp;
