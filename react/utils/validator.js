export const email = (value) =>
  value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
    ? "error.emailInvalid"
    : undefined;

export const username = (value) =>
  value && !/^[A-Z0-9.]+$/i.test(value) ? "error.usernameInvalid" : undefined;
