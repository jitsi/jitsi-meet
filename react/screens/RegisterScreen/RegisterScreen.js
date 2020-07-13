import React, { useState } from "react";
import { View, Text } from "react-native";
import { useSetRecoilState } from "recoil";
import { screenState } from "../../modules/navigator";
import * as validators from "../../utils/validator";
import TextDivider from "../../components/TextDivider/TextDivider";
import PostechLoginButton from "../../components/PostechLoginButton/PostechLoginButton";
import InputLabel from "../../components/InputLabel/InputLabel";
import SubmitButton from "../../components/SubmitButton/SubmitButton";
import Form from "../../components/Form/Form";
import { DARK_GRAY } from "../../consts/colors";
import api from "../../api";
import { JWT_TOKEN } from "../../config";
import AsyncStorage from "@react-native-community/async-storage";

const STATUS_BAR_HEIGHT = 70; // TODO : add react-native-status-bar-height library
// import {getStatusBarHeight} from 'react-native-status-bar-height';
// const iosStatusBarHeight = getStatusBarHeight();

const RegisterScreen = () => {
  const setScreen = useSetRecoilState(screenState);
  const navigate = (to) => {
    setScreen(to);
  };
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const [fullnameValid, setFullnameValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [fullnameErrorMsg, setFullnameErrorMsg] = useState("");
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [confirmPasswordErrorMsg, setConfirmPasswordErrorMsg] = useState("");

  const onPressRegisterSubmitButton = () => {
    setLoading(true);
    const form = {
      email,
      name: fullname,
      username,
      password,
      confirm: confirmPassword,
    };
    api
      .signup(form)
      .then(async (resp) => {
        const token = resp.data;
        await AsyncStorage.setItem(JWT_TOKEN, token);
        setLoading(false);
        navigate("Home");
      })
      .catch((error) => {
        const errCode = error.response.headers["www-authenticate"];
        if (errCode === "username_in_use") {
          setUsernameVaild(false);
          setUsernameErrorMsg("error.usernameInUse");
        } else if (errCode === "email_in_use") {
          setEmailVaild(false);
          setEmailErrorMsg("error.emailInUse");
        } else {
          setEmailValid(false);
          setEmailErrorMsg("register.fail");
        }
        setLoading(false);
      });
  };

  const checkVaildEmail = (value) => {
    const error = validators.email(value);
    if (error) {
      setEmailErrorMsg(error);
      return false;
    } else if (value === "") {
      setEmailErrorMsg("error.emailRequired");
      return false;
    }
    return true;
  };
  const checkVaildFullname = (value) => {
    if (value === "") {
      setFullnameErrorMsg("error.fullnameRequired");
      return false;
    } else if (value && value.length < 2) {
      setFullnameErrorMsg("error.fullnameTooShort");
      return false;
    }
    return true;
  };
  const checkVaildUsername = (value) => {
    const error = validators.username(value);
    if (error) {
      setUsernameErrorMsg(error);
      return false;
    } else if (value === "") {
      setUsernameErrorMsg("error.usernameRequired");
      return false;
    } else if (value && value.length < 5) {
      setUsernameErrorMsg("error.usernameTooShort");
      return false;
    }
    return true;
  };
  const checkVaildPassword = (value) => {
    if (value.length >= 8) {
      return true;
    } else if (value === "") {
      setPasswordErrorMsg("error.passwordRequired");
      return false;
    }
    setPasswordErrorMsg("error.passwordTooShort");
    return false;
  };
  const checkVaildConfirmPassword = (value) => {
    if (value === password) {
      return true;
    }
    setConfirmPasswordErrorMsg("error.passwordNotMatch");
    return false;
  };

  const onChangeEmail = ({ nativeEvent: { text } }) => {
    setEmail(text);
    const validity = checkVaildEmail(text);
    setEmailValid(validity);
  };
  const onChangeFullname = ({ nativeEvent: { text } }) => {
    setFullname(text);
    const validity = checkVaildFullname(text);
    setFullnameValid(validity);
  };
  const onChangeUsername = ({ nativeEvent: { text } }) => {
    setUsername(text);
    const validity = checkVaildUsername(text);
    setUsernameValid(validity);
  };
  const onChangePassword = ({ nativeEvent: { text } }) => {
    setPassword(text);
    const validity = checkVaildPassword(text);
    setPasswordValid(validity);
  };
  const onChangeConfirmPassword = ({ nativeEvent: { text } }) => {
    setConfirmPassword(text);
    const validity = checkVaildConfirmPassword(text);
    setConfirmPasswordValid(validity);
  };

  return (
    <View style={{ ...styles.container }}>
      <Text style={{ fontSize: 20, fontWeight: "600", paddingBottom: 24 }}>
        Vmeeting Register
      </Text>
      <TextDivider text={"Create an account using"} />
      <PostechLoginButton />
      <TextDivider text={"or create new account"} style={{ paddingTop: 20 }} />
      <InputLabel name="E-mail" necessary={true} />
      <Form
        value={email}
        onChange={onChangeEmail}
        valid={emailValid}
        errorMessage={emailErrorMsg}
      />
      <InputLabel name="Full Name" necessary={true} />
      <Form
        value={fullname}
        onChange={onChangeFullname}
        valid={fullnameValid}
        errorMessage={fullnameErrorMsg}
      />
      <InputLabel name="Username" necessary={true} />
      <Form
        value={username}
        onChange={onChangeUsername}
        valid={usernameValid}
        errorMessage={usernameErrorMsg}
      />
      <InputLabel name="Password" necessary={true} />
      <Form
        type={"password"}
        value={password}
        onChange={onChangePassword}
        valid={passwordValid}
        errorMessage={passwordErrorMsg}
      />
      <InputLabel name="Confirm Password" necessary={true} />
      <Form
        type={"password"}
        value={confirmPassword}
        onChange={onChangeConfirmPassword}
        valid={confirmPasswordValid}
        errorMessage={confirmPasswordErrorMsg}
      />
      <SubmitButton
        name="Register"
        invalid={
          !(
            emailValid &&
            fullnameValid &&
            usernameValid &&
            passwordValid &&
            confirmPasswordValid
          )
        }
        onPress={onPressRegisterSubmitButton}
        loading={loading}
      />
      <Text
        onPress={() => navigate("Login")}
        style={{ ...styles.navigateText }}
      >
        Already Registered? - Login
      </Text>
    </View>
  );
};
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: 24,
  },
  navigateText: {
    alignSelf: "center",
    paddingVertical: 20,
    color: DARK_GRAY,
  },
};
export default RegisterScreen;
