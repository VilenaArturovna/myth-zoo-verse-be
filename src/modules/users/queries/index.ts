import {
  GetUserController,
  GetUserQueryHandler,
} from '@modules/users/queries/user';

export * from './user';

export const queryControllers = [GetUserController];

export const queryHandlers = [GetUserQueryHandler];
