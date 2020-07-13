import React, { useState } from "react";
import { View, Image, Text } from "react-native";
import { DARK_GRAY, MAIN_BLUE } from "../../consts/colors";
import AutoLoginCheckBox from "../../components/AutoLoginCheckBox/AutoLoginCheckBox";
import Form from "../../components/Form/Form";
import PostechLoginButton from "../../components/PostechLoginButton/PostechLoginButton";
import TextDivider from "../../components/TextDivider/TextDivider";
import SubmitButton from "../../components/SubmitButton/SubmitButton";
import InputLabel from "../../components/InputLabel/InputLabel";
import { postech_logo } from "../../assets";
import { screenState } from "../../modules/navigator";
import { useSetRecoilState } from "recoil";
import * as validators from "../../utils/validator";

const STATUS_BAR_HEIGHT = 70; // TODO : add react-native-status-bar-height library
// import {getStatusBarHeight} from 'react-native-status-bar-height';
// const iosStatusBarHeight = getStatusBarHeight();

const LoginScreen = () => {
  const setScreen = useSetRecoilState(screenState);
  const [remember, setRemember] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameValid, setUsernameValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  const onPressPostechLoginButton = () => {};
  const onPressLoginSubmitButton = () => {
    //   api.login(form)
    //   .then(resp => {
    //     const token = resp.data;
    //     window.localStorage.setItem(AUTH_JWT_TOKEN, token);
    //     window.location.href = next || '/';
    //   })
    //   .catch(err => {
    //     const reason = err.response.headers['www-authenticate'];
    //     let description = err.message;
    //     if (reason === 'user_not_found') {
    //       description = t('error.usernameInvalid');
    //     } else if (reason === 'password_not_match') {
    //       description = t('error.passwordNotMatch');
    //     }
    //     notification.error({
    //       message: t('login.loginFailed'),
    //       description,
    //     });
    // });
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

  const onChangeUsername = ({ nativeEvent: { text } }) => {
    setUsername(text);
    const validity = checkVaildUsername(text);
    setUsernameValid(validity);
  };

  const checkValidPassword = (value) => {
    if (value.length >= 8) {
      return true;
    } else if (value === "") {
      setPasswordErrorMsg("error.passwordRequired");
      return false;
    }
    setPasswordErrorMsg("error.passwordTooShort");
    return false;
  };

  const onChangePassword = ({ nativeEvent: { text } }) => {
    setPassword(text);
    const validity = checkValidPassword(text);
    setPasswordValid(validity);
  };

  const onChangeRememberCheckBox = () => {
    setRemember(!remember);
  };

  const navigate = (to) => {
    setScreen(to);
  };

  return (
    <View style={{ ...styles.container }}>
      <Image
        source={postech_logo}
        style={{ width: 200, alignSelf: "center", paddingBottom: 160 }}
        resizeMode="contain"
      />
      <View>
        <InputLabel name={"Username"} necessary={true} />
        <Form
          value={username}
          onChange={onChangeUsername}
          valid={usernameValid}
          errorMessage={usernameErrorMsg}
        />
        <InputLabel name={"Password"} necessary={true} />
        <Form
          type="password"
          value={password}
          onChange={onChangePassword}
          valid={passwordValid}
          errorMessage={passwordErrorMsg}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 5,
            paddingBottom: 28,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <AutoLoginCheckBox
              checked={remember}
              onChange={onChangeRememberCheckBox}
            />
            <Text>Remember me</Text>
          </View>
          <Text style={{ color: MAIN_BLUE }}>Forgot password</Text>
        </View>
        <SubmitButton
          invalid={!(passwordValid && usernameValid)}
          name={"Login"}
          onPress={onPressLoginSubmitButton}
        />
        <Text
          style={{
            alignSelf: "center",
            paddingVertical: 20,
            color: DARK_GRAY,
          }}
          onPress={() => {
            navigate("Register");
          }}
        >
          Are you not a registered user? - Register
        </Text>
        <TextDivider text="or login with" />
        <PostechLoginButton onPress={onPressPostechLoginButton} />
      </View>
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
};

export default LoginScreen;
