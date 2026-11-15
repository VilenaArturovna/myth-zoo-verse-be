import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AuthSettings } from '@src/common/config/auth-configuration';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}
export abstract class MailTransport {
  abstract send(message: MailMessage): Promise<void>;
}
@Injectable()
export class PostboxTransport extends MailTransport implements OnModuleDestroy {
  private readonly transport: nodemailer.Transporter;
  private readonly from: { name: string; address: string };
  constructor(config: ConfigService) {
    super();
    const smtp = config.get<AuthSettings>('auth').smtp;
    this.from = { name: smtp.fromName, address: smtp.fromAddress };
    this.transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: false,
      requireTLS: true,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      logger: false,
      debug: false,
    });
  }
  async send(message: MailMessage) {
    const info = await this.transport.sendMail({ ...message, from: this.from });
    if (!info.accepted?.length || info.rejected?.length)
      throw new Error('SMTP_NOT_ACCEPTED');
  }
  onModuleDestroy() {
    this.transport.close();
  }
}
export class MemoryMailTransport extends MailTransport {
  readonly messages: MailMessage[] = [];
  fail = false;
  async send(message: MailMessage) {
    if (this.fail) throw new Error('TEST_SMTP_FAILURE');
    this.messages.push(message);
  }
}
export type AuthMailPurpose =
  | 'verify-email'
  | 'reset-password'
  | 'password-changed';
@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  constructor(
    private readonly config: ConfigService,
    private readonly transport: MailTransport,
  ) {}
  async send(to: string, purpose: AuthMailPurpose, token?: string) {
    const titles = {
      'verify-email': 'Подтвердите адрес электронной почты',
      'reset-password': 'Восстановление пароля',
      'password-changed': 'Пароль изменён',
    };
    const subject = titles[purpose];
    let text =
      'Пароль вашего аккаунта изменён. Если это были не вы, обратитесь в поддержку платформы.';
    let html = `<p>${text}</p>`;
    if (purpose !== 'password-changed') {
      const settings = this.config.get<AuthSettings>('auth');
      const url = new URL(
        purpose === 'verify-email'
          ? '/auth/verify-email'
          : '/auth/reset-password',
        settings.frontendUrl,
      );
      url.hash = new URLSearchParams({ token }).toString();
      const action =
        purpose === 'verify-email'
          ? 'Подтвердить почту'
          : 'Установить новый пароль';
      const minutes = Math.ceil(
        (purpose === 'verify-email'
          ? settings.verifySeconds
          : settings.resetSeconds) / 60,
      );
      text = `${subject}. Откройте ссылку и подтвердите действие на странице: ${url.href}\nСсылка действует ${minutes} мин. Если вы не отправляли запрос, проигнорируйте письмо.`;
      const escaped = url.href
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
      html = `<h1>${subject}</h1><p><a href="${escaped}">${action}</a></p><p>Подтвердите действие на странице. Ссылка действует ${minutes} мин.</p><p>Если вы не отправляли запрос, проигнорируйте письмо.</p>`;
    }
    try {
      await this.transport.send({ to, subject, text, html });
      return true;
    } catch {
      // Never log provider errors: they can contain message bodies, credentials or recipients.
      this.logger.warn({ event: 'auth_mail_not_accepted', purpose });
      return false;
    }
  }
}
