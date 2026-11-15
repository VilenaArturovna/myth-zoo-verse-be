# Email/password и общие сессии платформы

Один NestJS backend, UUID users.id для email/пароля и Telegram. Email не заменяет внутреннюю идентичность. Новый Telegram Login JS описан в [отдельном контракте](telegram-login.md). Legacy HMAC endpoint удалён. Frontend не создан; ниже — серверный API.

## Настройка и миграции

`yarn install --frozen-lockfile`, копия `.env.example` → `.env` с собственными секретами. Настроить PostgreSQL, SMTP, доверенные HTTPS origins/frontend URL, отдельный JWT_ACCESS_SECRET>=32 символов и TELEGRAM_CLIENT_ID. На подготовленном окружении после backup — `yarn migration:run`, затем `yarn start:dev`; Swagger `/api`. Рабочая БД в ходе разработки не изменялась.

Миграция `20261029000000_email_auth.ts`: email/emailVerifiedAt/passwordHash nullable, tgId nullable bigint; authSessions/authRefreshTokens/authOneTimeTokens/authRateLimits. Следующая `20261029010000_telegram_oidc.ts`: попытки Telegram и external identities. Старые users.id, role, статистика, crystals и reports FK сохраняются. Legacy users.refreshTokenHash очищается первой миграцией и больше не используется; старые JWT без session ID требуют повторного входа. Применённые миграции не переписываются.

Обратная email-миграция отказывается работать при наличии email credentials/email-only пользователей или Telegram ID вне int32; обратная OIDC-миграция — при наличии external identities. Откат с удалением credentials/identities не является безопасным автоматическим сценарием. Knex допускает отсутствующий необязательный zoo migration directory.

## Email и пароль

- Email: ASCII, формат и максимум 254 символа, trim + lowercase всего адреса. Для международного домена использовать punycode. Точки и `+suffix` сохраняются. PostgreSQL canonical CHECK и unique lower(email COLLATE C) дают ту же политику, включая конкурентные регистрации.
- Пароль: 15–128 Unicode-символов, пробелы разрешены; без trim/нормализации/правил состава. Argon2id: 65536 KiB, timeCost=3, parallelism=1, индивидуальная случайная соль. Вход допускает 1–128 символов и даёт общую ошибку для неверного/неизвестного/неподтверждённого аккаунта; неизвестный email проверяется против dummy hash с теми же параметрами.
- Повторная регистрация не меняет пароль/роль/данные существующего аккаунта. Новая регистрация получает role=user, totalStitches=0, crystals=100 из UserEntity; клиент не задаёт права/балансы/подтверждение.
- Telegram-only email/passwordHash остаются NULL. Нет фиктивных credentials. Будущий OAuth тоже может не иметь пароля. Автоматического merge по email/username/имени нет.

## API

POST требуют `Origin` из AUTH_ALLOWED_ORIGINS, JSON и `credentials:'include'`, пустое тело — `{}`. Access JWT хранить в памяти, отправлять Bearer. Полные DTO/статусы доступны в Swagger.

| Метод и URL                    | Тело           | Успех и доступ                                                                    |
| ------------------------------ | -------------- | --------------------------------------------------------------------------------- |
| POST /auth/register            | email,password | 202 нейтральный Message; public                                                   |
| POST /auth/verify-email        | token          | 200 Message, без сессии; public                                                   |
| POST /auth/resend-verification | email          | 202 нейтральный Message; public                                                   |
| POST /auth/login               | email,password | 200 SessionResponse + HttpOnly cookies; public                                    |
| POST /auth/forgot-password     | email          | 202 нейтральный Message; public                                                   |
| POST /auth/reset-password      | token,password | 200 Message, без автоматического входа; public                                    |
| GET /auth/csrf                 | —              | csrfToken при действующих refresh/CSRF cookies и Origin, без обязательного access |
| POST /auth/refresh             | {}             | 200 SessionResponse + новые cookies либо 409, cookies + X-CSRF-Token              |
| POST /auth/logout              | {}             | 200 Message, Bearer + CSRF + Origin, отзыв текущего устройства                    |
| POST /auth/logout-all          | {}             | 200 Message, Bearer + CSRF + Origin, отзыв всех устройств UUID                    |
| GET /me                        | —              | Public profile без секретов; Bearer                                               |

Message = `{message:string}`. SessionResponse = `{accessToken, expiresIn, user}`. Public user = id, username, email/emailVerifiedAt/photoUrl (nullable), role, totalStitches, crystals, createdAt, updatedAt. Никаких passwordHash, tgId, refresh hash, browser/CSRF hash в public user. GET /users/:id также не предоставляет refresh-хеш.

400 — DTO/invalid token; 401 — credentials/session; 403 — Origin/CSRF; 409 — непосредственный refresh duplicate; 413 — auth body>16 KiB; 429 — quota/cooldown; 500 — обезличенная ошибка. Нейтральный 202 означает принятие запроса, не наличие аккаунта и не доставку письма.

## Cookies, CSRF, отзыв и refresh

Access HS256: sub=user UUID, sid=session UUID, typ=access, issuer=myth-zoo-verse, audience=platform. Каждый защищённый запрос проверяет user и действительную сессию; для email method проверяет emailVerifiedAt. Logout/reset/replay немедленно запрещают последующие запросы со старым access. Уже начавшийся запрос нельзя отозвать задним числом.

Refresh — 256-битный случайный секрет, только HttpOnly host-only `platform_refresh`; `platform_csrf` также HttpOnly. Обе cookie Path=/auth, SameSite=lax по умолчанию; в staging/production Secure обязателен. Для cross-site размещения SameSite=none + Secure, но браузер может запретить third-party cookies; предпочтителен same-site frontend/backend. Domain не задаётся. Refresh не возвращается в JSON и не хранится в localStorage.

После login клиент получает `/auth/csrf` с cookies/Origin, сохраняет csrfToken в памяти и передаёт X-CSRF-Token в refresh/logout/logout-all. Проверяется совпадение с cookie и серверным session.csrfHash. CORS/Origin — дополнительные барьеры. Для logout с истёкшим access сначала нужен refresh.

Каждый login создаёт независимое устройство/семью. Абсолютный срок по умолчанию 30 дней, access максимум 15 минут; ротация/дубли срок не продлевают. Ротация атомарна под блокировками user/session. Сырые refresh не сохраняются; consumed hashes нужны до конца семьи.

**Непосредственные дубли:** AUTH_REFRESH_DUPLICATE_SECONDS=5. В этом окне старый consumed refresh с правильным CSRF получает 409 `{code:'REFRESH_ALREADY_ROTATED',...}`, без Set-Cookie/очистки cookies, без выдачи новых токенов и без отзыва семьи. usedAt не изменяется. За пределами окна old-token replay с правильным серверным CSRF отзывает семью; другая device family остаётся активной. Неверный CSRF не отзывает семью.

Компромисс: за 5 секунд невозможно отличить гонку вкладок от предъявления украденного токена, поэтому немедленный дубль не приводит к отзыву. Это grace для отказа дублю, а не кеширование/повторная выдача raw-токенов. Клиенту всё равно рекомендуется единый refresh coordinator (Web Locks/BroadcastChannel). На 409 дождаться победителя, использовать его access или после координации обновить access по уже заменённой cookie; не запускать бесконечный цикл old-token retries. Если успешный ответ/Set-Cookie потеряны, прозрачного восстановления сервер не гарантирует: нужен новый login. Не продлевать окно повторными попытками.

Logout-all отзывает существующие сессии. Незавершённые Telegram attempts не отменяются и могут завершить новый вход при валидных token/nonce/browser binding до expiry; это проверяемая политика, а не запрет будущей аутентификации.

## Письма и одноразовые ссылки

verify-email/reset-password — случайные 256-битные токены, в БД только SHA-256, разные назначения и TTL 24 часа/30 минут. Погашение и изменение пользователя — одна транзакция, конкурентно побеждает один запрос. Подтверждение закрывает другие verification-токены; reset меняет пароль, закрывает все сессии и reset-токены; не выполняет автоматический login и отправляет уведомление без пароля.

Ссылка строится из доверенного FRONTEND_URL и фиксированных `/auth/verify-email` или `/auth/reset-password`; токен во fragment `#token=...`. Frontend читает fragment, очищает URL, показывает явную кнопку и выполняет POST. Не запускать POST автоматически при открытии страницы; GET не расходует токен, почтовый сканер не должен его погашать. Host/redirect из запроса не используется.

Письма идут после commit, без открытой транзакции БД. SMTP failure сохраняет аккаунт, даёт нейтральный ответ с предупреждением об отсутствии гарантии доставки; resend доступен после cooldown. Старые непогашенные ссылки не инвалидируются простым resend. Сбой уведомления после reset не откатывает пароль. В журнале только purpose/event без provider error/body/recipient.

Очереди/outbox и автоматического SMTP-retry нет: синхронная отправка с ограниченными таймаутами. SMTP acceptance не равно доставке; при неясном сетевом исходе возможны несколько писем с разными действующими до TTL ссылками. Для гарантированной повторной доставки потребуется отдельный полноценный worker.

## Postbox и квоты

Согласно [официальной инструкции Postbox](https://yandex.cloud/ru/docs/postbox/operations/send-email): подтвердить домен/DNS/DKIM и настроить SPF/DMARC; сервисный аккаунт должен быть в каталоге адреса и иметь postbox.sender. Выбран API-key scope yc.postbox.send: SMTP_USER — ID API-ключа, SMTP_PASSWORD — его секрет. Для static access key нужен другой, производный SMTP-пароль; raw static secret нельзя подставлять вместо него. Client Secret Telegram к SMTP не относится.

SMTP_HOST=postbox.cloud.yandex.net, SMTP_PORT=587, обязательный STARTTLS, TLS>=1.2, сертификат проверяется; debug выключен. Задать подтверждённый SMTP_FROM_ADDRESS и SMTP_FROM_NAME. Проверить консольную отправку/собственную регистрацию и фактическое получение; можно использовать [симулятор доставки](https://yandex.cloud/ru/docs/postbox/concepts/mail-simulator). Реальный Postbox в тестах не вызывается.

Лимиты в PostgreSQL: register/resend/forgot — 5 на email/15 минут, login — 10, token verify/reset — 10 на hash, refresh/csrf bootstrap — 60 на семью; per-IP у этих сервисных квот втрое выше. Ранний общий auth IP-limit=180/15 минут до parsing/DTO дополняет их. Общий rolling mail cooldown=60 секунд для register/resend/forgot на email. Telegram имеет отдельные start/complete/verified-subject/JWKS квоты — см. его контракт. Fixed windows допускают burst на границе. In-memory fallback отсутствует.

TRUST_PROXY_CIDRS пуст → XFF не доверяется; за proxy задать только его IP/CIDR и закрыть прямой доступ. Не использовать blanket trust. Псевдонимизированные bucket keys — SHA-256, не гарантия анонимности низкоэнтропийных email/IP.

Worker очищает expired attempts/rate buckets; session/refresh history сохраняется. Её retention после абсолютного expiry требует отдельной эксплуатационной политики. Нет логирования bodies/Authorization/Cookie/Set-Cookie/id_token/nonce/binding/паролей; Knex debug выключен. Proxy/APM/frontend должны следовать той же политике.

## Проверки и оставшиеся настройки

Тестовый runner требует явный loopback AUTH_TEST_DATABASE_URL с БД auth_test, игнорирует application .env и использует уникальные схемы. `yarn test:e2e --runInBand` сохраняет email-регрессии и проверяет OIDC с контролируемым JWKS; `yarn test --runInBand` — unit. Настройки и результаты — [TELEGRAM_AUTH_REVIEW.md](../../TELEGRAM_AUTH_REVIEW.md).

Вручную нужны реальные Postbox/DNS/credentials, BotFather Client ID/Allowed URLs, HTTPS/cookies/proxy, миграции целевого окружения и frontend. Реальный Telegram flow не проверен. Безопасная привязка email к существующему Telegram UUID и account merge не реализованы: будущий flow должен доказать владение существующим аккаунтом и email, сохранить UUID и отдельно разрешить конфликты. Предположения по username/совпадающему email недопустимы.
