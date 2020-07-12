import React from "react";
import { View, Text } from "react-native";
import TextDivider from "../../components/TextDivider/TextDivider";
import PostechLoginButton from "../../components/PostechLoginButton/PostechLoginButton";
import InputLabel from "../../components/InputLabel/InputLabel";
import SubmitButton from "../../components/SubmitButton/SubmitButton";
import { DARK_GRAY } from "../../consts/colors";
import Form from "../../components/Form/Form";

const STATUS_BAR_HEIGHT = 70; // TODO : add react-native-status-bar-height library
// import {getStatusBarHeight} from 'react-native-status-bar-height';
// const iosStatusBarHeight = getStatusBarHeight();

const RegisterScreen = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        paddingTop: STATUS_BAR_HEIGHT,
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600", paddingBottom: 50 }}>
        Vmeeting Register
      </Text>
      <TextDivider text={"Create an account using"} />
      <PostechLoginButton />
      <TextDivider text={"or create new account"} style={{ paddingTop: 20 }} />
      <InputLabel name="E-mail" necessary={true} />
      <Form />
      <InputLabel name="Full Name" necessary={true} />
      <Form />
      <InputLabel name="Username" necessary={true} />
      <Form />
      <InputLabel name="Password" necessary={true} />
      <Form />
      <InputLabel name="Confirm Password" necessary={true} />
      <Form />
      <SubmitButton name="Register" />
      <Text
        style={{
          alignSelf: "center",
          paddingVertical: 20,
          fontColor: DARK_GRAY,
        }}
      >
        Already Registered? - Login
      </Text>
    </View>
  );
};

export default RegisterScreen;
