import { ExceptionBase } from '@libs/base-classes';
import { ValidationException } from '@libs/exceptions';
import { Result } from '@libs/utils';
import { ISendWelcomeMessageRequest } from '@modules/telegram/service/telegram-bot.types';

export interface TelegramBotInterface {
  setWebhook(domain: string): Promise<Result<void, ValidationException>>;
  deleteWebhook(): Promise<Result<void, ValidationException>>;
  getWebhookInfo(): Promise<Result<string, ValidationException>>;

  sendWelcomeMessage(
    props: ISendWelcomeMessageRequest,
  ): Promise<Result<void, ExceptionBase>>;
}
