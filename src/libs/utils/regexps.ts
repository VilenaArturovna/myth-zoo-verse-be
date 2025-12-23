export const passwordRegexp =
  /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,100}$/;

export const telegramRegexp =
  /(?:https?:\/\/(www\.))?[-a-zA-Z0-9@:%._~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_.~#?&=]*)/;

export const slugRegexp = /^[a-z0-9-]{3,80}$/;
