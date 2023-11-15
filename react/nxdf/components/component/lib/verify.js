import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { isVerify } from "./atom";

export const verifyemail = (email) => {
    console.log(`email:${email}`);
    let pattern = /^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    if (email.match(pattern)) {
        return true;
    } else {
        return false;
    }
};
export const verifypass = (password) => {
    console.log(`email:${password}`);
    let pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (password.match(pattern)) {
        return true;
    } else {
        return false;
    }
};

