# Telegram Login JS: контракт backend

Актуально на 29 октября 2026. Используется современная Telegram Login JS library с серверной проверкой `id_token` и nonce. Email/пароль остаются независимым способом входа. Legacy HMAC Widget endpoint `/user/login-via-tg` удалён из регистрации; Mini App initData и второй redirect/code-flow не реализованы.

Официальные источники: [Telegram Login JS и OIDC](https://core.telegram.org/bots/telegram-login), [Telegram Bot API User](https://core.telegram.org/bots/api#user), [jose](https://github.com/panva/jose). Telegram описывает profile.id как ID пользователя; OIDC sub — отдельная строка. Код сопоставляет прежний users.tgId только с проверенным profile.id, сохраняя subject отдельно. Подпись — через официальный JWKS, RS256; Client Secret нужен другому, redirect/code flow и здесь не требуется.

## Настройка

1. В BotFather выбрать бота → Login Widget, получить Client ID и зарегистрировать Allowed URLs для frontend origins. Настроить RS256 (Advanced), поскольку другие алгоритмы backend отклоняет.
2. Задать TELEGRAM_CLIENT_ID (строка с безопасно представимым числом), AUTH_ALLOWED_ORIGINS и FRONTEND_URL. Для staging/production — HTTPS, COOKIE_SECURE=true. Backend completion — собственный JSON POST, не Telegram redirect URI.
3. TELEGRAM_JWKS_URL по умолчанию и в любом обычном окружении — строго `https://oauth.telegram.org/.well-known/jwks.json`. Другая HTTP-loopback точка допускается только при NODE_ENV=test для контролируемого JWKS fixture; URI токена/запроса не принимаются.
4. TG_BOT_TOKEN/TG_BOT_NAME необязательны и в Login JS не используются. Они оставлены для отдельного будущего канала уведомлений. Client Secret не конфигурируется. JWT_ACCESS_SECRET — отдельный секрет платформы.
5. Если frontend задаёт COOP, проверить popup communication: Telegram предупреждает о несовместимости `Cross-Origin-Opener-Policy: same-origin`; рассмотреть `same-origin-allow-popups`. Настроить CSP по требованиям выбранной библиотеки. Ни браузер, ни BotFather в автоматических тестах не проверялись.

## Начало и завершение

Все POST — `Origin` из allowlist, `Content-Type: application/json`, `credentials: 'include'`. Ранний IP-limit выполняется до body parsing/DTO и учитывает malformed JSON, oversized body и неправильные DTO. Auth body ограничен 16 KiB, idToken — 8192 символами. Для остальных API сохранён стандартный лимит 100 KiB.

`POST /auth/telegram/start`, тело `{}` → 200:

```json
{
  "attemptId": "<UUID>",
  "nonce": "<256-bit base64url>",
  "clientId": "12345678",
  "scope": ["profile"],
  "expiresAt": "<ISO time>"
}
```

Отдельный случайный 256-битный browser secret устанавливается только в HttpOnly host-only cookie `telegram_login_attempt`, Path=/auth/telegram, Secure/SameSite по общей политике, expiry равен попытке. В БД хранятся только nonceHash/browserHash. Публичный nonce намеренно возвращается frontend, но не должен попадать в аналитику/логи.

Будущий клиент (фрагмент контракта, frontend не создан):

```js
const attempt = await fetch('/auth/telegram/start', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
}).then((r) => r.json());
Telegram.Login.auth(
  {
    client_id: Number(attempt.clientId),
    scope: attempt.scope,
    nonce: attempt.nonce,
  },
  async (result) => {
    // Check callback error. Do not trust/log result.user or the ID token.
    if (!result.id_token) return;
    const response = await fetch('/auth/telegram/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: attempt.attemptId,
        idToken: result.id_token,
      }),
    });
    // Handle status before parsing/storing accessToken in memory.
  },
);
```

`POST /auth/telegram/complete` принимает только намерение завершить attemptId и idToken. Отдельный клиентский nonce не является источником истины; callback.user не используется. Проверяются browser cookie, существование/срок/статус попытки, затем реальная подпись и claims, затем signed nonce, затем квота **проверенной** issuer/subject. В транзакции повторно проверяются expiry попытки и допустимый срок токена, блокируется попытка, связывается внешняя идентичность и создаётся сессия. usedAt записывается одновременно с user/identity/session/refresh; ошибка откатывает всё.

Успех: 200 `{accessToken, expiresIn, user}` и обычные platform refresh/CSRF HttpOnly-cookies. Подтверждённый email для method=telegram не требуется. email/emailVerifiedAt/passwordHash нового Telegram-only пользователя — NULL; UUID, роль user и стартовые значения — обычные платформенные. Username берётся только из подписанного preferred_username, максимум 255 символов, без NUL/некорректного Unicode; пустое/неверное значение отклоняется. При повторном входе существующие профиль/роль/балансы/credentials не перезаписываются.

## Вкладки, однократность и сетевые ошибки

Одна текущая binding cookie выбирает попытку браузера. Последующий последовательный start отменяет незавершённую попытку из присланной предыдущей cookie и заменяет cookie. Старый callback перестаёт работать. Frontend должен координировать start между вкладками: при одновременных start без общей предшествующей cookie могут существовать несколько короткоживущих строк, но браузер отправляет только последнюю применённую cookie. Порядок доставки ответов не обязан совпадать с началом запросов; нельзя обещать «последний по времени вызова всегда победит». Вне браузера каждый независимый cookie jar — отдельная привязка.

Completion не очищает короткоживущую binding cookie: consumed attempt больше ничего не разрешает, а запоздавший ответ не должен удалять новую cookie другой вкладки. Cookie истечёт по TTL или заменится новым start. Не пытаться сохранять/передавать browser secret в JS/localStorage.

Конкурентное завершение одной попытки создаёт максимум одну сессию. Повтор получает 409 `TELEGRAM_ATTEMPT_USED`, без Set-Cookie, создания сессии и очистки cookies. Полный использованный ID token не даёт войти через новую попытку: signed nonce и browserHash не совпадут. В отличие от прежней схемы свежесть токена сама по себе больше не является разрешением на повтор.

Если успешный ответ потерян после commit, backend не хранит сырые refresh для его воспроизведения. Если браузер получил session cookies, клиент может проверить `/auth/csrf` и восстановить access через refresh. Если cookies не получены — начать новый login с новой nonce. Автоматическое прозрачное восстановление не гарантируется.

**Logout-all:** отзывает существующие сессии UUID, но не отменяет незавершённые попытки (до проверки ID token они не привязаны к аккаунту). Владелец корректной ещё не использованной попытки может завершить новый вход после logout-all. Это сознательная политика, проверенная тестом; logout-all не является запретом будущих аутентификаций. Повтор уже использованной попытки остаётся невозможен. Привязка email/merge и согласие бота на уведомления — отдельные задачи.

## Проверки JWT и JWKS

jose v6 проверяет подпись по trusted RemoteJWKSet. Разрешён **только RS256**; issuer точно `https://oauth.telegram.org`; aud — одна строка, равная TELEGRAM_CLIENT_ID. Массивы audience не поддерживаются и отклоняются; azp, если присутствует, должен равняться Client ID. Обязательны sub/aud/iss/exp/iat/nonce/id. sub — непреобразуемая в число непустая печатная ASCII-строка до 255 символов. Число Telegram id — положительный safe integer до 2^52−1 и затем decimal string для bigint.

exp/iat — целые NumericDate; exp строго в будущем и больше iat, span не больше часа. Максимальный возраст iat по умолчанию 300 секунд; future skew до 30 секунд. nbf, если есть, целый и не дальше 30 секунд в будущее. Проверенный validUntil=min(exp,iat+maxAge) проверяется снова внутри транзакции, чтобы ожидание блокировки не разрешило просроченный токен. nonce должен совпасть с серверным хешем. При выключенной/недоступной проверке входа нет.

JWKS cache в памяти каждого процесса: 10 минут, unknown-kid cooldown 30 секунд, HTTP timeout 2 секунды. Ротация новых kid подхватывается после cooldown; на этот интервал новый ключ может давать отказ. Глобальная PostgreSQL-квота — 10 **сетевых fetch**/минуту на JWKS URL, общая для экземпляров. jose объединяет одновременную загрузку своего resolver. Неизвестные kid не вызывают бесконечный fetch; сбой/invalid remote JSON/таймаут/исчерпание внешней квоты даёт 503 `TELEGRAM_KEYS_UNAVAILABLE`. Неизвестный kid при доступном наборе и неверная подпись/claims — 401. БД/кеш не принимают ключи из клиентских данных; jku/x5u из JWT не используются.

Кеш означает, что удалённый провайдером ключ может использоваться до обновления кеша при ещё допустимом токене. Допустимый риск и TTL нужно учитывать при эксплуатации. Мгновенный глобальный отзыв issuer key не обещается.

## Идентичности и миграция

Новая миграция `20261029010000_telegram_oidc.ts` создаёт authLoginAttempts и authExternalIdentities. Уже существующие миграции не переписаны. External identity: UNIQUE(provider,issuer,subject), UNIQUE(provider,issuer,telegramId), UNIQUE(provider,issuer,userId), FK userId→users.id. Subject хранится строкой независимо от tgId.

Проверенный profile.id связывается с прежним users.tgId транзакционно; при отсутствии такого user создаётся Telegram-only user. Используются advisory locks по Telegram id/subject и UNIQUE constraints. Существующие UUID и reports FK сохраняются; одноимённые email/Telegram-аккаунты не объединяются. Несовпадающие subject/id/user links → 409 и rollback. При смене Client ID/семантики subject требуется отдельная проверка миграции, не автоматический merge. До production необходимо проверить реальный signed profile.id известного тестового Telegram-аккаунта и сопоставление его прежнему tgId; автоматические тесты используют синтетические данные.

Обратная миграция отказывается удалять уже существующие external identities. Удаление пользователей каскадно удаляет внешние identities/sessions; доступ старых JWT проверяется по наличию user/session.

## Квоты, ошибки, обслуживание

| Уровень                             | Значение по умолчанию | Когда считается                    |
| ----------------------------------- | --------------------- | ---------------------------------- |
| Start IP                            | 20/900 сек            | До body/DTO                        |
| Complete IP                         | 60/900 сек            | До body/DTO                        |
| Другие auth POST/PATCH IP           | 180/900 сек           | До body/DTO                        |
| Проверенный Telegram issuer/subject | 10/900 сек            | После JWT + nonce/browser проверки |
| Сетевой JWKS fetch                  | 10/60 сек на URL      | В customFetch, общий PostgreSQL    |

Квоты — fixed windows; на границе возможен burst двух окон. Неизвестный/неподписанный subject из payload не расходует чужую account-квоту. TRUST_PROXY_CIDRS по умолчанию пуст: XFF игнорируется. За proxy нужны явные адреса/CIDR и запрет прямого доступа к серверу. In-memory limiter fallback отсутствует.

400 — DTO/JSON; 401 — invalid ID token/nonce/binding/expiry; 403 — Origin/CSRF; 409 — consumed attempt/identity conflict/refresh duplicate; 413 — oversized body; 429 — auth quota; 503 — external verification unavailable или ранний limiter не может обратиться к БД. Ошибки не возвращают JWT/nonce/binding/hash.

Работающий worker каждые 60 секунд удаляет до 500 истёкших attempts и 500 старых rate buckets, транзакционно с SKIP LOCKED. Несколько процессов безопасны; после рестарта подбирается старое. Сам worker останавливается при app.close. Никакие очереди без потребителя не добавлены. Сессии/refresh history этим worker **не удаляются**, чтобы сохранить replay detection до абсолютного expiry; их дальнейший retention требует эксплуатационной политики.

Логи исключают тела запросов/ответов, Authorization/Cookie/Set-Cookie и поля idToken/id_token/nonce/browser secret/refresh/CSRF/credentials; SQL bindings и SMTP debug выключены. Публичный nonce в start JSON, access JWT в session JSON, refresh/CSRF/binding в HttpOnly Set-Cookie — необходимые части контракта, а не утверждение «секретов в любом ответе нет».

## Проверки

`yarn test:e2e --runInBand` с AUTH_TEST_DATABASE_URL на loopback БД `auth_test`: реальные Nest HTTP/DTO/guards/CQRS/транзакции PostgreSQL, временный локальный JWKS HTTP-server и случайные RSA keys. Успешный validator не mock: jose проверяет реальные подписи. SMTP заменён memory transport, исходный ObjectionConfigService — для привязки к тестовой схеме, логгер e2e отключён. Подписи не получены от Telegram.

Unit: `yarn test --runInBand`; compile: `yarn build` и tsc --noEmit. Jest запускается с experimental-vm-modules для native import jose ESM в CommonJS проекте. Runtime требует Node>=20.19; Docker node:20 подходит при актуальном образе. Repro commands и результаты — в TELEGRAM_AUTH_REVIEW.md и новом архиве.
