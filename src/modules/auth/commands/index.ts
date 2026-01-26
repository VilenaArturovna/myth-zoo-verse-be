import {
  LoginViaTgCommandHandler,
  LoginViaTgController,
} from '@modules/auth/commands/login-via-tg';

export * from './login-via-tg';

export const commandControllers = [LoginViaTgController];
export const commandHandlers = [LoginViaTgCommandHandler];
