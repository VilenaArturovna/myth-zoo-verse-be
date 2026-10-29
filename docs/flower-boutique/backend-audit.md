# Аудит backend перед интеграцией «Цветочного бутика»

Дата: 29 октября 2026 года. Основа: локальное рабочее дерево проекта, HEAD `a453edb`, включая существующие незакоммиченные изменения. Это проект архитектуры для согласования, а не реализация игры.

Проведён статический анализ исходников, миграций, конфигурации и тестов. Проверка `./node_modules/.bin/tsc --noEmit --incremental false --pretty false -p tsconfig.build.json` завершилась успешно. Приложение, контейнеры, миграции, seed и запросы к БД не запускались. Реальная схема, содержимое БД, развёрнутая версия и поведение под нагрузкой не проверены. В рамках аудита создан только этот документ; исходные пользовательские изменения сохранены.

Обозначения: **факт** — найден в текущем коде; **рекомендация** — предлагается к реализации после согласования; **вопрос** — требует продуктовых или эксплуатационных данных. Все новые имена модулей, таблиц, событий и API ниже являются предложениями.

## 1. Текущая архитектура проекта

### Стек и инфраструктура

| Область | Что найдено | Основание |
| --- | --- | --- |
| Сервер | TypeScript, NestJS 10, адаптер Express; один процесс приложения | [package.json](../../package.json), [bootstrap](../../src/main.ts) |
| Сценарии | Nest CQRS: CommandBus/QueryBus, отдельные контроллеры и обработчики | [ReportsModule](../../src/modules/reports/reports.module.ts), [ApproveReportController](../../src/modules/reports/commands/report/approve-report/approve-report.controller.ts) |
| Данные | PostgreSQL через `pg`, Knex 3 и Objection 3; глобальная привязка `Model.knex(knex)` | [ObjectionConfigService](../../src/common/services/objection-config.service.ts) |
| Локальное окружение | Dockerfile на Node 20; Compose описывает PostgreSQL 16 и Redis 7 | [Dockerfile](../../Dockerfile), [compose.yml](../../compose.yml) |
| Конфигурация | Глобальный ConfigModule, env → вложенная конфигурация, Joi-валидация | [AppModule](../../src/app.module.ts), [configuration](../../src/common/config/configuration.ts), [validationSchema](../../src/common/config/validation.schema.ts) |
| API и диагностика | Swagger `/api`, pino, глобальный ExceptionInterceptor, ValidationPipe с `whitelist: true`, `cors: true` | [main.ts](../../src/main.ts), [exceptionMapper](../../src/libs/exceptions/exception.mapper.ts) |
| Генерация шаблонов | Hygen для command/query/domain/ORM | [scripts](../../package.json), [шаблон команды](../../_templates/CQRS/command/new/command-handler.ejs.t) |

Версии выше отражают объявления зависимостей и образы, а не проверенную production-инфраструктуру. Redis присутствует в Compose и конфигурации, но клиента Redis, очереди и кода использования Redis в `src` не найдено. Наличие зависимости `@nestjs/schedule` также не означает работающий планировщик: `ScheduleModule` и декораторы фоновых задач в исходниках не найдены ([package.json](../../package.json), [AppModule](../../src/app.module.ts)).

### Серверные модули и границы

- `UsersModule`: пользователь, роль, статистика `totalStitches`, платформа `crystals`, refresh-хеш; экспортирует GetUserReadDao и UsersUnitOfWork ([модуль](../../src/modules/users/users.module.ts), [UserEntity](../../src/modules/users/domain/entities/user.entity.ts)).
- `AuthModule`: подключённый Telegram-вход, JWT-стратегии; импортирует UsersModule ([модуль](../../src/modules/auth/auth.module.ts)).
- `ReportsModule`: отчёты и кодовые слова; отдельные `commands`, `queries`, `domain`, `database/entities`, `mappers`, `repositories`, `read-model`, `unit-of-work`, `dtos`, `types` ([модуль](../../src/modules/reports/reports.module.ts)). Это основной образец для игры.
- `WorldModule`: подключён к AppModule, содержит WorldUnitOfWork, доменные и ORM-сущности зоопарка; контроллеров и прикладных обработчиков в регистрации нет ([WorldModule](../../src/modules/world/world.module.ts), [WorldUnitOfWork](../../src/modules/world/database/unit-of-work/world.unit-of-work.ts)). Нельзя считать его готовым игровым сервисом.
- `CreatorsModule`: пустая регистрация; в дереве есть CreatorEntity с `essence` и ёмкостью склада яиц, ORM и репозиторий ([модуль](../../src/modules/creators/creators.module.ts), [CreatorEntity](../../src/modules/creators/domain/entities/creator.entity.ts)).
- `TelegramModule`: содержит webhook-контроллеры и сервис бота, но не импортирован в текущий AppModule; CreatorsModule тоже не импортирован ([AppModule](../../src/app.module.ts), [TelegramModule](../../src/modules/telegram/telegram.module.ts)). Не считать эти API доступными только на основании наличия файлов.

Общие строительные блоки: EntityBase/ValueObject, OrmMapper, ObjectionRepositoryBase, Result, CommandHandlerBase и UnitOfWork ([EntityBase](../../src/libs/base-classes/entity.base.ts), [OrmMapper](../../src/libs/base-classes/orm-mapper.base.ts), [репозиторий](../../src/libs/base-classes/objection.repository.base.ts), [обработчик](../../src/libs/base-classes/command-handler.base.ts)). Это модульный монолит с разделением чтения и команд, без обнаруженного event sourcing.

### Авторизация

**Факт.** Глобальный `APP_GUARD = JwtAuthGuard` защищает маршруты, кроме отмеченных `@Public()`. Access JWT извлекается из Bearer-заголовка, payload содержит `id`, стратегия читает пользователя через GetUserReadDao ([AppModule](../../src/app.module.ts), [guard](../../src/modules/auth/guards/jwt-auth.guard.ts), [стратегия](../../src/modules/auth/strategies/jwt-access.strategy.ts), [MyId](../../src/common/decorators/my-id.decorator.ts)).

Подключён публичный `PATCH /user/login-via-tg`: находит/создаёт пользователя, выдаёт access/refresh в JSON, сохраняет refresh-хеш. Telegram HMAC проверяется только при `app.env === 'production'`; срок давности `auth_date` не проверяется. Результат `repository.update(user)` при сохранении хеша не проверяется ([контроллер](../../src/modules/auth/commands/login-via-tg/login-via-tg.controller.ts), [LoginViaTgCommandHandler](../../src/modules/auth/commands/login-via-tg/login-via-tg.command-handler.ts), [checkTelegramHash](../../src/libs/utils/check-telegram-hash.util.ts)). Для публичного staging обход подписи также существенен.

Файлы AuthController/AuthService с login/refresh/logout присутствуют, но не зарегистрированы в AuthModule; в сервисе остаются заглушки. Зарегистрированная JwtRefreshStrategy ожидает cookie и `sub`, тогда как подключённый Telegram-вход выдаёт payload `id`; cookie-parser в bootstrap закомментирован. Рабочий полный refresh/logout-flow по этому коду не подтверждён ([AuthModule](../../src/modules/auth/auth.module.ts), [AuthController](../../src/modules/auth/auth.controller.ts), [AuthService](../../src/modules/auth/auth.service.ts), [JwtRefreshStrategy](../../src/modules/auth/strategies/jwt-refresh.strategy.ts), [main.ts](../../src/main.ts)).

Роли `user/admin/reviewer` определены, но role guard и проверки роли на действиях review/approve/reject/skip не найдены. `@ApiBearerAuth()` описывает Swagger, дополнительных прав не выдаёт ([Role](../../src/modules/users/types/role.type.ts), [контроллер подтверждения](../../src/modules/reports/commands/report/approve-report/approve-report.controller.ts)). Дополнительно GetUserReadDao возвращает `Result.ok(undefined)` для отсутствующего пользователя, а access-стратегия проверяет только `isErr`; явную проверку существования пользователя следует добавить до запуска игры ([DAO](../../src/modules/users/database/read-model/user/get-user/get-user.objection.read.dao.ts), [стратегия](../../src/modules/auth/strategies/jwt-access.strategy.ts)).

### API и соглашения

Маршруты централизованы в [routes.ts](../../src/libs/routes.ts). Подключённые прикладные API:

| Метод и путь | Назначение и исходники |
| --- | --- |
| `PATCH /user/login-via-tg` | [Telegram-вход](../../src/modules/auth/commands/login-via-tg/login-via-tg.controller.ts) |
| `GET /users/:id` | [Получение пользователя](../../src/modules/users/queries/user/get-user/get-user.controller.ts) |
| `POST /reports` | [Создание черновика](../../src/modules/reports/commands/report/create-report/create-report.controller.ts) |
| `PATCH /reports/:id` | [Редактирование](../../src/modules/reports/commands/report/update-report/update-report.controller.ts) |
| `PATCH /reports/:id/add-start-photo`, `/send-to-review` | [Стартовое фото](../../src/modules/reports/commands/report/add-start-photo/add-start-photo.controller.ts), [отправка](../../src/modules/reports/commands/report/send-to-review-report/send-to-review-report.controller.ts) |
| `PATCH /reports/:id/review`, `/approve`, `/reject`, `/skip` | [Взятие](../../src/modules/reports/commands/report/review-report/review-report.controller.ts), [подтверждение](../../src/modules/reports/commands/report/approve-report/approve-report.controller.ts), [отказ](../../src/modules/reports/commands/report/reject-report/reject-report.controller.ts), [пропуск](../../src/modules/reports/commands/report/skip-report/skip-report.controller.ts) |
| `GET /reports`, `/reports/my`, `/reports/next`, `/reports/:id` | [Регистрация query-контроллеров](../../src/modules/reports/queries/index.ts) |
| `PATCH /code-words/disable` | [Отключение кодового слова](../../src/modules/reports/commands/code-word/disable-word/disable-word.controller.ts) |

`routes.user.profile.me` — только константа: соответствующего подключённого контроллера не найдено. Есть также корневой GET с `Hello World!` ([AppController](../../src/app.controller.ts)). Глобальный URL-префикс и версионирование в bootstrap не заданы.

Новый сценарий следует оформлять в существующем стиле: DTO с class-validator/Swagger → контроллер с ParseUUIDPipe и MyId → command/query → обработчик → domain/repository либо read DAO → response DTO; обработчики и контроллеры явно добавлять в массивы модуля. Ошибки домена преобразуются в HTTP через Result.unwrap и exceptionMapper ([UpdateReportController](../../src/modules/reports/commands/report/update-report/update-report.controller.ts), [UpdateReportCommandHandler](../../src/modules/reports/commands/report/update-report/update-report.command-handler.ts), [регистрация команд](../../src/modules/reports/commands/index.ts)).

### Миграции и тесты

Knex использует каталоги `database/migrations/core` и `database/migrations/zoo`; в рабочем дереве найден только `core` с тремя миграциями: pgcrypto, users, codeWords/reports. ORM-имена `zoo*` существуют, но миграции их таблиц не найдены. Реальное наличие этих таблиц в БД неизвестно ([knexfile.ts](../../knexfile.ts), [CoreTables/ZooTables](../../src/libs/tables.ts), [миграции](../../database/migrations/core/20260208115108_reports.ts)). Seed заполняет кодовые слова ([seed](../../database/seeds/01-code-words.ts)). Миграционные scripts и rollback есть; script генерации заканчивается `--migrations-directory` и требует проверки корректного вызова. Уже применённые миграции не следует переписывать при реализации игры ([package.json](../../package.json)).

Jest ищет unit `src/**/*.spec.ts`; таких файлов не найдено. В `test` — один шаблонный e2e GET `/` без JWT, хотя AppController не `@Public()`. Это не покрытие отчётов, транзакций или торговли. E2e-конфигурация не задаёт aliases из tsconfig; работоспособность запуска отдельно не проверена ([package.json](../../package.json), [e2e](../../test/app.e2e-spec.ts), [jest-e2e.json](../../test/jest-e2e.json), [AppController](../../src/app.controller.ts)).

## 2. Устройство модуля отчётов

### Сущности и таблицы

- `ReportEntity` ↔ `reports`: `id`, `userId → users`, `codeWordId → codeWords`, статус, фото, комментарии, `stitchesRaw jsonb`, `stitchesNormalized integer`, `reviewerId/skipReviewerId → users`, сроки проверки/удаления и `approvedAt`.
- `CodeWordEntity` ↔ `codeWords`: уникальное слово, активность; используется при создании отчёта.
- `UserEntity` ↔ `users`: `totalStitches`, `crystals`, роль и Telegram ID. Это общеплатформенные поля, не игровые энергия/монеты.

Источники: [миграция отчётов](../../database/migrations/core/20260208115108_reports.ts), [миграция пользователей](../../database/migrations/core/20251224135743_users.ts), [ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts), [CodeWordEntity](../../src/modules/reports/domain/entities/code-word.entity.ts), [ReportOrmMapper](../../src/modules/reports/database/mappers/report.orm-mapper.ts), [ORM-связи](../../src/modules/reports/database/entities/report/report.objection.orm-entity.ts).

### Жизненный цикл

| Переход | Фактическое поведение |
| --- | --- |
| Создание → `draft` | Ноль стежков; активное случайное кодовое слово с исключением предыдущего; запрет ещё одного черновика по последнему отчёту пользователя |
| `draft/rejected` → `pending` | Владелец отправляет фото и количества; update пересчитывает нормализованное число, затем sendToReview меняет статус |
| `pending` → `inReview` | startReview записывает reviewerId и срок `now + 5 minutes` |
| `inReview` → `pending` | skip очищает проверяющего/срок, запоминает skipReviewerId |
| `inReview` → `rejected` | reject сохраняет комментарий и очищает проверяющего/срок |
| `inReview` → `approved` | approve сохраняет approvedAt, deleteAt=`now + 1 week`, очищает срок; reviewerId остаётся |

Основания: [методы ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts), [CreateReportCommandHandler](../../src/modules/reports/commands/report/create-report/create-report.command-handler.ts), [SendToReviewReportCommandHandler](../../src/modules/reports/commands/report/send-to-review-report/send-to-review-report.command-handler.ts).

`checkCanUpdate()` разрешает обычное редактирование только `pending/rejected`, а не `draft`. Для черновика есть отдельное добавление стартового фото и отправка с полным набором данных. `update()` сам не проверяет статус: защита зависит от вызывающего обработчика. Метод validate содержит минимум 100 нормализованных крестиков вне draft, но первая отправка вызывает update ещё в draft, а sendToReview не вызывает validate; минимум в этом переходе не обеспечен ([ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts), [обработчик отправки](../../src/modules/reports/commands/report/send-to-review-report/send-to-review-report.command-handler.ts)).

### Подтверждение, количество крестиков и повторные запросы

ApproveReportController передаёт **только ID отчёта**; ApproveReportCommandHandler читает сущность, вызывает approve, делает общий repository.update. В обработчике есть TODO статистики/total stitches/essence, но ни одного фактического начисления. `UserEntity.addStitches()` существует, однако из подтверждения не вызывается ([контроллер](../../src/modules/reports/commands/report/approve-report/approve-report.controller.ts), [обработчик](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts), [UserEntity](../../src/modules/users/domain/entities/user.entity.ts)).

**Кандидат на принятые крестики — `reports.stitchesNormalized` в момент успешного подтверждения.** Отдельного поля `acceptedStitches` и отдельного значения, которое вводит проверяющий, нет. Нормализация: `ceil(crosses + halfCrosses / 2 + (petits + beads) / 1.5)`. Исходные полные крестики — `stitchesRaw.crosses` ([StitchesVO.calcNormalized](../../src/modules/reports/domain/value-objects/stitches.value-object.ts)). Например, 100 полных и 10 полукрестиков дают 105 нормализованных, но только 100 полных. **Вопрос:** правило «1 подтверждённый крестик» относится к нормализованному эквиваленту или только к полным? До ответа `stitchesNormalized` — рекомендация, а не установленное бизнес-правило. Формулу и округление нужно версионировать в записи начисления.

Последовательный повтор approve после коммита отклоняется проверкой `inReview`. Но два конкурентных запроса могут прочитать одно состояние `inReview` и оба выполнить patch по ID: чтение не использует блокировку, а update не содержит условия по старому статусу/версии. Поэтому текущий отказ повторного запроса **не обеспечивает однократность начисления** ([ReportObjectionRepository.getOneById](../../src/modules/reports/database/repositories/report.objection.repository.ts), [ObjectionRepositoryBase.update](../../src/libs/base-classes/objection.repository.base.ts)).

### Изменение, отмена, сроки и связи

В последовательном штатном API approved нельзя редактировать, повторно отправить, reject или skip; метода отмены подтверждения и delete-контроллера нет. Но это не жёсткая гарантия БД: общий patch записывает всю сущность без CAS/lock. Конкурентный update/send-to-review, прочитавший старую версию, может затереть более новый статус и поля. Следовательно, при подключении энергии необходимо защищать **все** команды записи отчёта, не только approve ([ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts), [UpdateReportCommandHandler](../../src/modules/reports/commands/report/update-report/update-report.command-handler.ts), [SendToReviewReportCommandHandler](../../src/modules/reports/commands/report/send-to-review-report/send-to-review-report.command-handler.ts), [базовый update](../../src/libs/base-classes/objection.repository.base.ts)).

Срок reviewExpiresAt пока только записывается: автоматический возврат из inReview отмечен TODO. Проверки истечения срока в approve нет. deleteAt означает «когда можно удалить», но обработчик физического удаления в src не найден ([ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts)).

DAO не подходят как источник финансового начисления или полной сверки:

- GetApprovedReports фильтрует deleteAt, поэтому выдача не равна полной истории подтверждений; сравнение сделано с параметром-строкой `'now()'`, а не явным SQL-вызовом времени ([DAO](../../src/modules/reports/database/read-model/report/get-approved-reports/get-approved-reports.objection.read.dao.ts)).
- GetMyReports исключает NULL deleteAt, хотя у неподтверждённых отчётов это штатное значение ([DAO](../../src/modules/reports/database/read-model/report/get-my-reports/get-my-reports.objection.read.dao.ts)).
- GetOneReport выбирает только NULL deleteAt и поэтому скрывает подтверждённые записи; reviewer join сделан по userId, а не reviewerId. В обоих DAO с reviewer alias используется TypeScript `as`, а не SQL alias ([GetOneReport DAO](../../src/modules/reports/database/read-model/report/get-one-report/get-one-report.objection.read.dao.ts), [GetApprovedReports DAO](../../src/modules/reports/database/read-model/report/get-approved-reports/get-approved-reports.objection.read.dao.ts)).
- GetNextReport читает все pending без блокировки/резервирования и без исключения собственного отчёта. Поиск «уже взятого мной» внутри этой выборки не охватывает обычные inReview ([DAO](../../src/modules/reports/database/read-model/report/get-next-report/get-next-report.objection.read.dao.ts), [query handler](../../src/modules/reports/queries/report/get-next-report/get-next-report.query-handler.ts)).

Связи с пользователями и кодовыми словами реализованы через FK и ORM. Реальных domain events, EventBus.publish, event handlers, outbox, подписок зоопарка на подтверждение и начислений essence не обнаружено: ReportEntity наследует обычный EntityBase, ReportsModule регистрирует только command/query handlers и DAO ([EntityBase](../../src/libs/base-classes/entity.base.ts), [ReportsModule](../../src/modules/reports/reports.module.ts), [ApproveReportCommandHandler](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts)).

## 3. Найденные точки интеграции

| Точка | Что использовать и что потребуется |
| --- | --- |
| Идентичность | `users.id`, access guard, MyId; игровой профиль 1:1 с платформенным пользователем. Источник: [стратегия](../../src/modules/auth/strategies/jwt-access.strategy.ts), [MyId](../../src/common/decorators/my-id.decorator.ts). Исправить ошибки auth, не заводить второй вход |
| Подтверждение отчёта | ApproveReportCommandHandler как место прикладной координации перехода и кредита. Источник: [handler](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts). Добавить защиту прав, конкуренции и журнал начислений |
| Общая транзакция | Репозитории принимают UoW/trxId. Источник: [ReportsUnitOfWork](../../src/modules/reports/database/unit-of-work/reports.unit-of-work.ts), [ObjectionRepositoryBase](../../src/libs/base-classes/objection.repository.base.ts). Передавать один и тот же реальный Transaction в адаптер игры |
| Регистрация игры | Добавить FlowerBoutiqueModule в существующий AppModule после согласования. Следовать структуре ReportsModule. Источники: [AppModule](../../src/app.module.ts), [ReportsModule](../../src/modules/reports/reports.module.ts) |
| Таблицы и миграции | Отдельный префикс `flower*` и каталог миграций игры; позднее зарегистрировать каталог в Knex. Основание: уже разделённые [CoreTables/ZooTables](../../src/libs/tables.ts), [knexfile](../../knexfile.ts) |
| Премиум | Ввести порт чтения общеплатформенных прав; готового провайдера не найдено. В UserEntity нет подписки; Telegram `is_premium` в webhook DTO не является правом платформы. Источники: [UserEntity](../../src/modules/users/domain/entities/user.entity.ts), [Telegram DTO](../../src/modules/telegram/commands/telegram-webhook/telegram-webhook.request.dto.ts) |

Не использовать `users.totalStitches` как баланс: это накопительная статистика, и она пока даже не обновляется из approve. Не использовать crystals или zoo essence как игровые монеты/энергию без отдельного продуктового решения ([UserEntity](../../src/modules/users/domain/entities/user.entity.ts), [CreatorEntity](../../src/modules/creators/domain/entities/creator.entity.ts), [approve handler](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts)).

## 4. Рекомендуемая архитектура игрового backend

### Размещение и модули

**Рекомендация:** FlowerBoutiqueModule в существующем приложении, с той же БД и CQRS-подходом. Отдельный backend, отдельная авторизация и перенос отчётов не нужны. Основание — существующий [AppModule](../../src/app.module.ts), [ReportsModule](../../src/modules/reports/reports.module.ts), единый [ObjectionConfigService](../../src/common/services/objection-config.service.ts).

Внутри новой области выделить следующие прикладные границы, первоначально без отдельных сервисов развёртывания:

| Область | Ответственность |
| --- | --- |
| Профиль/кошелёк | Балансы энергии и монет, резерв монет, история движений, кредит по отчёту |
| Клумбы/выращивание | Доступность слота, посадка, расход энергии/семян по согласованным правилам, серверные plantedAt/readyAt, однократный сбор |
| Склад | Количество по виду/качеству, резерв и доступный остаток; выдача урожая и списание материалов |
| Заказы/букеты | Серверный генератор, сохранённые требования и награда, резервирование ингредиентов, сборка, исполнение заказа |
| Биржа/бартер | Предложение, резерв актива, принятие, расчёт, отмена/истечение, история и защита от гонок |
| Журнал | Неизменяемые события действий с actorId, operationId, sourceId; экономические проводки отдельно от текстового журнала |
| Премиальные возможности | Проверка платформенных capabilities через порт, без собственного биллинга и права менять подписку |

Структуру `domain/commands/queries/database/dtos/types` взять из ReportsModule, но конкурентные игровые операции реализовать специализированными методами репозиториев: общий read→patch из [ObjectionRepositoryBase](../../src/libs/base-classes/objection.repository.base.ts) не обеспечивает нужных инвариантов. Существующий MoneyVO содержит только RUB и не подходит без изменений для игровой валюты ([MoneyVO](../../src/libs/value-objects/money.value-object.ts)).

Предлагаемый API-префикс `/flower-boutique`: GET `/me`, `/beds`, `/inventory`, `/orders`, `/market`, `/events`; команды посадки/сбора, сборки/сдачи букета, создания/принятия/отмены сделки. Суммы наград, цены системных операций, сроки роста, userId и premium вычисляет сервер. Клиент передаёт намерение, допустимые предметы/количества и ключ идемпотентности. Контракты DTO и методы уточняются на этапе проектирования; это пока не существующие маршруты ([текущие соглашения routes](../../src/libs/routes.ts), [образец контроллера](../../src/modules/reports/commands/report/update-report/update-report.controller.ts)).

### Однократное начисление энергии

**Предпочтительный первый вариант — синхронный кредит в одной PostgreSQL-транзакции с подтверждением.** Он соответствует текущему монолиту и устраняет окно «отчёт подтверждён, энергия не начислена». Привязка — `report.id`, получатель — сохранённый `report.userId`, количество — согласованное поле и его неизменяемый снимок, коэффициент строго 1:1. Не брать количество от клиента и не начислять по GET/открытию игры.

Предлагаемый алгоритм:

1. Аутентифицировать вызывающего, проверить роль проверяющего/администратора и право на конкретный отчёт; запретить самопроверку. Определить политику истёкшей проверки. Проверять это внутри операции, а не доверять UI.
2. Открыть одну транзакцию; прочитать строку reports под `SELECT ... FOR UPDATE` без блокировки присоединённых nullable-связей. **Все прочие команды, меняющие отчёт, должны соблюдать тот же lock-протокол** либо CAS по версии. Полный patch устаревшей сущности недопустим.
3. Для `inReview` проверить назначение reviewerId и выполнить переход approved с временными метками. Для уже approved искать сохранённый кредит; при совпадении вернуть прежний результат без нового движения. Если записи нет, использовать явно предусмотренный путь восстановления/исторического начисления, а не молча подтверждать повторно.
4. Обеспечить игровой профиль пользователя через уникальность userId. Рекомендация — технический профиль создаётся лениво при первом кредите, даже до первого запуска игры; продуктовую допустимость согласовать.
5. Вставить `flowerEnergyGrants` со снимком количества/правила и `UNIQUE(reportId)`. `INSERT ... ON CONFLICT (reportId) DO NOTHING RETURNING ...`: только успешная вставка разрешает кредит. При конфликте сверить пользователя и снимок, а не считать любое несовпадение успехом.
6. Создать единственную проводку энергии с уникальным source grantId, выполнить SQL-инкремент баланса и записать событие в той же транзакции. При любой ошибке откатить и подтверждение, и grant, и проводку, и баланс. Все Result ошибок должны проверяться/unwrap.
7. Зафиксировать транзакцию, затем вернуть ответ. Потеря ответа после commit безопасна: повтор находит ту же запись, возвращает исход операции и не начисляет повторно.

Реализуемость основана на [CommandHandlerBase.execute](../../src/libs/base-classes/command-handler.base.ts), [UnitOfWorkObjection](../../src/libs/unit-of-work/unit-of-work.objection.ts), [репозиториях](../../src/libs/base-classes/objection.repository.base.ts). Сейчас этого алгоритма в коде нет. `CommandBase.trxId` случайно генерируется для каждой команды и **не является** устойчивым ключом повторного HTTP-запроса ([CommandBase](../../src/libs/base-classes/command.base.ts)).

Важно: разные экземпляры ReportsUnitOfWork/UsersUnitOfWork/будущего игрового UoW имеют разные in-memory Map транзакций. Один trxId сам по себе не объединит их в одну транзакцию. Нужен единый координатор и адаптер кредита, принимающий конкретный Transaction/общий UoW; вложенный CommandBus.execute с независимым UoW/commit для кредита здесь не подходит ([ReportsUnitOfWork](../../src/modules/reports/database/unit-of-work/reports.unit-of-work.ts), [UsersUnitOfWork](../../src/modules/users/database/unit-of-work/users.unit-of-work.ts), [UnitOfWorkObjection](../../src/libs/unit-of-work/unit-of-work.objection.ts)). Домен ReportEntity не должен знать таблицы игры: связь оформляется через прикладной порт.

Для существующих approved-отчётов — отдельная возобновляемая сверка/backfill прямым запросом reports и anti-join по grant, без фильтров пользовательских DAO. Тот же unique(reportId) и та же транзакция кредита защищают пересечение backfill и live-обработки. Отчёты, которые уже физически удалены без архива, восстановить из кода нельзя. Нужно согласовать дату отсечения и исторические начисления; до этого backfill не запускать.

Если позднее потребуется асинхронная развязка: в транзакции approve писать долговечное outbox-событие `ReportApproved` с reportId/userId/количеством/версией правила; worker доставляет повторно, потребитель делает grant+проводку+баланс одной транзакцией и подтверждает обработку. Нужны уникальность источника, lease/retry и мониторинг задержки. Обычного EventBus недостаточно для переживания остановки процесса. Outbox и worker **отсутствуют сейчас** ([ReportsModule](../../src/modules/reports/reports.module.ts), [approve handler](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts)); не применять синхронное и асинхронное начисление как два независимых источника.

### Транзакции, торговля и восстановление

| Задача | Предлагаемое обеспечение |
| --- | --- |
| Энергия/монеты | Целые неотрицательные остатки; условный UPDATE с проверкой достаточности и RETURNING; проводка и баланс в одной транзакции. Не использовать JS read→write для суммы |
| Резерв цветов/монет | Количество available = total − reserved; CHECK `0 <= reserved <= total`. Создание сделки и увеличение резерва одной транзакцией; резерв — сохраняемая запись с источником и статусом |
| Одновременная покупка | Блокировка строки сделки, проверка open/expiresAt серверным временем БД; блокировка профилей и складских строк обеих сторон в общем детерминированном порядке; атомарный обмен активами и закрытие сделки. Один победитель, остальные получают сохранённый исход/конфликт |
| Бартер | При создании резервируется отдаваемое; при принятии проверяются/резервируются встречные активы; обе передачи, освобождение резервов и статус settled коммитятся вместе. Никакой последовательности отдельных HTTP-передач |
| Сбор урожая/сдача заказа | Lock или CAS статуса и однократная запись источника награды; списание, награда, новый статус и журнал в одном commit |
| Истечение | Периодический worker выбирает просроченные open-сделки с `FOR UPDATE SKIP LOCKED`; перепроверяет состояние, снимает резерв и ставит expired одной транзакцией. Accept/cancel используют тот же протокол. Просроченная сделка не принимается даже при задержке worker |
| Повторы HTTP | Запись операции с `UNIQUE(userId, commandType, idempotencyKey)`, хешем запроса и исходом; другой payload с тем же ключом — конфликт. Запись результата и экономические изменения коммитятся вместе |
| Ошибки конкуренции | Ограниченные повторы всей транзакции при deadlock/serialization failure, с тем же ключом операции. Внешние вызовы не держать под блокировками |
| Сбой | До commit изменения откатываются БД; после commit состояние читается по операции/журналу. Время роста и истечения хранится в БД; после рестарта worker подбирает просроченное. Не рассчитывать на таймер в памяти |

Основание для возможностей транзакций — [UoW](../../src/libs/unit-of-work/unit-of-work.objection.ts) и [конфигурация PostgreSQL](../../src/common/services/objection-config.service.ts). Lock/CAS, CHECK остатков, дедупликация команд и worker — новые механизмы: в текущих [репозиториях](../../src/libs/base-classes/objection.repository.base.ts) и [миграциях](../../database/migrations/core/20260208115108_reports.ts) их нет.

Для первой версии удобно использовать блокировку профилей как общий mutex экономических команд пользователя; все операции обязаны соблюдать единый порядок: строка источника операции (отчёт/сделка/заказ/клумба), затем профили по userId, затем склад по `(userId, itemId)`. Точный протокол закрепить при проектировании, включая создание отсутствующих строк и работу worker. Одних доменных методов debit недостаточно для защиты от гонок.

Сверка после сбоя: grants против approved reports; grants против единственной credit-проводки; баланс против суммы проводок (включая начальный остаток); reserves против открытых сделок/сборок; выполненные заказы и урожай против наград. Обнаруженное расхождение блокирует затронутые операции и требует контролируемого исправления. Резервная копия/PITR и проверка восстановления необходимы на уровне эксплуатации, но их наличие из [compose.yml](../../compose.yml) не следует: там только named volumes.

### Премиум

Предлагаемый `PlatformEntitlementsPort` возвращает capabilities и срок/версию платформенных прав. Игра проверяет нужную capability сервером при действии; сохраняет применённую версию в событии. При недоступности платформы — согласованная политика кеша с коротким TTL; новых премиальных разрешений по умолчанию не выдавать. Уже выращенные цветы, заработанные остатки и активные резервы не удалять из-за истечения подписки; правила дополнительных слотов согласовать.

Игра не продаёт премиум, не меняет platform entitlement и не использует Telegram `is_premium`. Конкретный адаптер нельзя спроектировать без контракта общей платформы: его в текущем [UsersModule](../../src/modules/users/users.module.ts) нет. Базовый курс энергии остаётся 1:1; премиум не должен незаметно умножать кредит по отчёту.

## 5. Предлагаемые новые таблицы и связи

Все таблицы ниже **отсутствуют в существующих миграциях**. Имена предварительные; camelCase/префикс выбраны по аналогии с [CoreTables/ZooTables](../../src/libs/tables.ts), UUID и FK — с [миграцией reports](../../database/migrations/core/20260208115108_reports.ts). Это логическая модель, не SQL-миграция.

| Таблица | Основные поля и связи | Ограничения/индексы |
| --- | --- | --- |
| `flowerProfiles` | `userId PK/FK users.id`, energy, coins, coinsReserved, timestamps | CHECK остатков и резерва; 1:1 users |
| `flowerEnergyGrants` | id, reportId, userId → profile, acceptedStitches, energyAmount, reportApprovedAt, ruleVersion, createdAt | UNIQUE(reportId), `energyAmount = acceptedStitches >= 0`; неизменяемый снимок |
| `flowerWalletEntries` | id, userId → profile, currency=`energy/coins`, delta, operationId, sourceType/sourceId, createdAt | UNIQUE(sourceType, sourceId, currency, leg), индекс userId/createdAt; один grant → один energy credit; у перевода две именованные стороны |
| `flowerOperations` | id, userId, commandType, idempotencyKey, requestHash, result/resourceId, createdAt | UNIQUE(userId, commandType, idempotencyKey); срок хранения определить по горизонту повторов |
| `flowerItemTypes` | id/code, kind (семя/цветок/букет), параметры сорта/качества, версия правил, активность | UNIQUE(code); типы расширять после продуктового решения |
| `flowerBeds` | id, userId → profile, slotNo, состояние, plantItemId → item type, plantedAt, readyAt, growthRuleVersion, cycleId | UNIQUE(userId, slotNo), индексы userId/status; cycleId обновляется при каждой посадке |
| `flowerInventory` | userId → profile, itemTypeId → item types, quantity, reserved | PK(userId, itemTypeId); CHECK `0 <= reserved <= quantity`; если требуется порча/уникальность — отдельные партии |
| `flowerOrders` | id, userId → profile, generationKey, requirementsVersion, rewardCoins, status, expiresAt, fulfilledAt | UNIQUE(userId, generationKey); индекс status/expiresAt; награда фиксируется при генерации |
| `flowerOrderItems` | orderId → orders, itemTypeId → item types, quantity | PK(orderId, itemTypeId), quantity > 0 |
| `flowerBouquets` / `flowerBouquetItems` | id, userId, status, orderId?, рецепт/снимок, состав и количества | Нужны при самостоятельном хранении/торговле букетами. Для мгновенной сдачи можно ограничиться orders + проводками склада |
| `flowerTrades` | id, makerId → profile, takerId?, kind=`sale/barter`, status, expiresAt, settledAt, operationId | Индекс status/expiresAt; запрет self-trade; исполненная/отменённая/истёкшая — терминальные состояния |
| `flowerTradeItems` | tradeId → trades, side=`offered/requested`, itemTypeId, quantity | UNIQUE(tradeId, side, itemTypeId), quantity > 0 |
| `flowerTradeCoins` | tradeId → trades, side, amount | UNIQUE(tradeId, side), amount > 0; цена/встречные монеты по согласованным правилам |
| `flowerReservations` | id, ownerId → profile, sourceType/sourceId, itemTypeId? либо currency, amount, status, expiresAt | CHECK ровно одного вида актива; уникальная строка резерва на источник/актив; изменение статуса только вместе с агрегатом резерва |
| `flowerInventoryEntries` | id, userId, itemTypeId, delta, operationId, sourceType/sourceId/leg, createdAt | UNIQUE источника/стороны/предмета; даёт сверку складских изменений |
| `flowerEvents` | id, userId/actorId, operationId, eventType, sourceType/sourceId, payload jsonb, createdAt | Append-only на уровне прикладного доступа; индекс userId/createdAt/id; пагинация без потери одинаковых времён |
| `platformOutbox` (опционально) | eventId, type, aggregateId, schemaVersion, payload, createdAt, nextAttemptAt, leaseUntil, attempts, processedAt | Только при согласовании асинхронной доставки; индекс необработанных/следующей попытки; не требуется для основного синхронного кредита |

Денежные/количественные поля — целые с CHECK и согласованным верхним пределом. Для больших накоплений выбрать BIGINT; в JSON отдавать decimal string либо явно ограничить диапазон безопасного JS integer. Не применять float для энергии, монет и количеств. Все новые сроки — явно согласованный timestamptz, сравнение по времени БД; существующая миграция reports использует Knex `t.timestamp(...)`, фактический тип и часовой пояс целевой БД в этом аудите не проверены ([миграция](../../database/migrations/core/20260208115108_reports.ts)).

Политика удаления критична: unique(reportId) и снимок кредита должны переживать очистку фотографий/отчётов. Предпочтительно сохранять минимальную строку отчёта и FK `RESTRICT`, удаляя медиа отдельно. Если платформа требует удаления самой строки, сохранить стабильный reportId в grant без каскадного удаления и согласовать архив/удаление персональных данных; нельзя делать reportId NULL и терять дедупликацию. Правила пока не определены; `deleteAt` само по себе не является реализацией удаления ([ReportEntity.approve](../../src/modules/reports/domain/entities/report.entity.ts)).

Отдельной игровой таблицы подписок не предлагается. Возможен только read-cache платформенных прав с sourceVersion/expiresAt, если этого потребует контракт платформы; он не источник истины.

## 6. Риски и технические ограничения

| Приоритет | Найденный риск | Что требуется до соответствующего этапа |
| --- | --- | --- |
| Блокирует кредит | Нет проверки роли, назначенного reviewer и запрета self-review; approve получает только reportId | Явная политика прав и её проверка во всех review-командах. [Approve controller](../../src/modules/reports/commands/report/approve-report/approve-report.controller.ts), [Review handler](../../src/modules/reports/commands/report/review-report/review-report.command-handler.ts), [ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts) |
| Блокирует экономику | Read→patch без блокировки/версии; гонки approve/reject/update | Единый протокол конкурентной записи, уникальные grants/operations и SQL-инварианты. [Репозиторий](../../src/libs/base-classes/objection.repository.base.ts), [репозиторий отчётов](../../src/modules/reports/database/repositories/report.objection.repository.ts) |
| Высокий | commit не вызывает finish, поэтому Map сохраняет завершённые транзакции; shared trxId не задаёт владельца commit | Исправить жизненный цикл UoW, очистку после завершения и координацию межмодульной транзакции. [UnitOfWorkObjection.commit/rollback](../../src/libs/unit-of-work/unit-of-work.objection.ts) |
| Высокий | Часть чтений репозиториев выполняется через `.query()` без transaction | Перевести необходимые для инвариантов чтения в общий trx, не считать обёртку обработчика достаточной. [getLastByUser](../../src/modules/reports/database/repositories/report.objection.repository.ts), [CodeWordRepository](../../src/modules/reports/database/repositories/code-word.objection.repository.ts) |
| Высокий | Не завершён auth/session-flow; проверка Telegram только в production, нет freshness auth_date | Закрыть повтор авторизации по устаревшим данным, согласовать окружения и полноценный refresh/revoke. [Login handler](../../src/modules/auth/commands/login-via-tg/login-via-tg.command-handler.ts), [hash helper](../../src/libs/utils/check-telegram-hash.util.ts), [AuthModule](../../src/modules/auth/auth.module.ts) |
| Высокий | Нет фонового возврата review, завершения сделок, outbox и мониторинга таких задач | Реализовать возобновляемый worker с безопасной многопроцессной обработкой; для сделок проверять expiry синхронно. [TODO review](../../src/modules/reports/domain/entities/report.entity.ts), [AppModule](../../src/app.module.ts) |
| Высокий | Нет тестов отчётов/экономики/конкуренции | Интеграционные проверки на реальном тестовом PostgreSQL и сценарии сбоев; текущий [e2e](../../test/app.e2e-spec.ts) — шаблон |
| Средний | DAO скрывают часть отчётов, неверно соединяют reviewer; GET по ID не проверяет владельца/роль | Отдельный полный запрос для сверки и исправление правил доступа/выдачи до использования в UI игры. [GetOne DAO](../../src/modules/reports/database/read-model/report/get-one-report/get-one-report.objection.read.dao.ts), [контроллер](../../src/modules/reports/queries/report/get-one-report/get-one-report.controller.ts) |
| Средний | Минимум стежков при первой отправке не гарантирован, нет БД CHECK на статус/количество | Валидировать после перехода и укрепить ограничения. [ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts), [миграция](../../database/migrations/core/20260208115108_reports.ts) |
| Средний | updatedAt не обновляется автоматически: базовый mapper передаёт старый timestamp, доменные методы отчёта не вызывают updatedAtNow | Явная стратегия updatedAt/version; не использовать updatedAt как готовый CAS. [EntityBase](../../src/libs/base-classes/entity.base.ts), [OrmMapper](../../src/libs/base-classes/orm-mapper.base.ts), [ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts) |
| Средний | В Knex указан отсутствующий каталог zoo, часть моделей без миграций; нет доказательства соответствия реальной БД | Проверить применённые миграции, структуру и процедуру deploy на отдельном окружении. [knexfile](../../knexfile.ts), [ZooTables](../../src/libs/tables.ts) |
| Требует данных | Премиум-провайдера и контракта нет | Получить договорённость с общей платформой. [UserEntity](../../src/modules/users/domain/entities/user.entity.ts) |

Дополнительные эксплуатационные ограничения: CORS открыт в bootstrap; rate limiting игровых команд и логирование идемпотентных операций не настроены в найденном коде. Перед публикацией определить разрешённые origins, лимиты, redaction токенов/персональных данных и метрики: задержка начисления, ошибки сверки, просроченные резервы, конфликты и повторы. Сейчас найден только общий [bootstrap](../../src/main.ts) и [Pino-конфиг](../../src/common/services/logger-module-config.service.ts), а не готовый игровой аудит.

## 7. Поэтапный план реализации

Каждый этап ниже — последующая работа после отдельного согласования архитектуры. Никаких миграций или реализаций в рамках этого аудита не выполнено.

1. **Согласовать инварианты и границы.** Выбрать значение «подтверждённого крестика», дату начала кредита, порядок создания профиля, политику исправления approved, модель премиума и торговые правила. Зафиксировать синхронную транзакцию как основной вариант либо аргументированно выбрать outbox. Результат — архитектурное решение и контракты; основание: неоднозначность [StitchesVO](../../src/modules/reports/domain/value-objects/stitches.value-object.ts), отсутствие интеграции в [approve handler](../../src/modules/reports/commands/report/approve-report/approve-report.command-handler.ts).
2. **Укрепить платформенную основу.** Права модерации, запрет self-review, единая защита всех report mutations, корректная валидация переходов, auth/session-flow, lifecycle UoW, необходимые DAO и миграционный путь. Результат — надёжное подтверждение без игры. Проверки: чужой reviewer, обычный пользователь, истёкшая проверка, гонки update/approve/reject, повтор approve, rollback, очистка Map. Основание: риски раздела 6 и [UoW](../../src/libs/unit-of-work/unit-of-work.objection.ts).
3. **Добавить профиль и энергию.** Модуль, минимальные таблицы profile/grants/wallet/operations/events, транзакционный порт кредита, read API баланса/истории. Проверки на PostgreSQL: N одновременных approve дают один grant и один кредит; ошибка после вставки grant откатывает всё; потерянный ответ не дублирует кредит; конкурентные отчёты одного владельца не теряют суммы; пользователь до первого входа в игру получает согласованный результат. Образец регистрации — [ReportsModule](../../src/modules/reports/reports.module.ts).
4. **Провести историческую сверку.** На копии данных оценить все approved и сохранность истории; выполнить согласованный dry run backfill, затем возобновляемое начисление тем же алгоритмом. Проверить пересечение live/backfill и рестарт между батчами. Обходить ограничения [GetApprovedReports DAO](../../src/modules/reports/database/read-model/report/get-approved-reports/get-approved-reports.objection.read.dao.ts).
5. **Выращивание и склад.** Каталог предметов, клумбы, инвентарь/движения, посадка/сбор; серверное время, ограничения доступности, однократность урожая по cycleId. Проверки: двойной сбор, параллельная посадка, нехватка энергии, рестарт после readyAt. Реализовать специализированные запросы, не копировать небезопасный [generic update](../../src/libs/base-classes/objection.repository.base.ts).
6. **Заказы, букеты, монеты.** Сохраняемый серверный генератор с уникальным generationKey, фиксированные состав/награда, атомарная сборка/сдача. Проверки: двойная сдача, конфликт заказ/торговля за один складской остаток, повтор генерации, обновление версии правил.
7. **Биржа, бартер и worker.** Резервы, lock order, исполнение, отмена/истечение, журнал; многопроцессный worker и сверка резервов. Проверки: два покупателя, accept против cancel/expire, взаимный бартер, deadlock retry, сбой до/после commit и остановка worker. Наличие schedule-зависимости в [package.json](../../package.json) не заменяет регистрацию и реализацию задач.
8. **Платформенный премиум и запуск.** Подключить согласованный entitlement adapter; проверить истечение прав при активных слотах/резервах и недоступность платформы. Провести нагрузочные тесты, восстановление из backup, настроить метрики/оповещения и контролируемый rollout. Определить rollback приложения без потери экономической истории; не удалять таблицы с реальными начислениями при откате версии.

Для этапов 2–8 нужны отдельная тестовая PostgreSQL, фикстуры и интеграционные сценарии. Простые mocks репозиториев не проверят уникальность, блокировки и rollback. Текущая успешная компиляция не доказывает корректность транзакций или runtime-авторизации ([существующая конфигурация тестов](../../test/jest-e2e.json)).

## 8. Вопросы, которые нельзя решить без дополнительных данных

1. **Как считать крестики?** `stitchesNormalized` с округлением или `stitchesRaw.crosses`? Нужно ли сохранять именно текущую формулу для всех исторических отчётов? В коде оба представления, но нет бизнес-контракта энергии ([StitchesVO](../../src/modules/reports/domain/value-objects/stitches.value-object.ts)).
2. **Исторические начисления:** с какой даты, всем ли пользователям, начислять ли до открытия игры, доступны ли удалённые отчёты/архивы? `approvedAt/deleteAt` есть, история удаления неизвестна ([ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts)).
3. **Коррекция/мошенничество:** нужна ли отмена approved, кто её делает и как возвращать уже потраченную энергию? Сейчас отмены нет. Рекомендация при появлении — отдельная компенсационная проводка с уникальным correctionId, без редактирования старого grant; долг/заморозку должен определить продукт.
4. **Права проверяющих:** кто назначает reviewer, может ли admin подтверждать чужую активную проверку, как обрабатывать истёкший lease, разрешена ли модерация своих отчётов? Роли есть, политика не реализована ([Role](../../src/modules/users/types/role.type.ts), [ReportEntity](../../src/modules/reports/domain/entities/report.entity.ts)).
5. **Общая платформа и премиум:** где источник истины, какие capabilities, API/события, срок кеша, условия отзыва и поведение при недоступности? `Telegram is_premium` не отвечает на эти вопросы ([DTO](../../src/modules/telegram/commands/telegram-webhook/telegram-webhook.request.dto.ts)).
6. **Игровые правила:** количество клумб, цены посадки, рост/полив, лимиты энергии, складские ёмкости, порча/качество/редкость цветов, семена, рецепты, хранение и торговля букетами. В текущем коде «Цветочного бутика» нет; структуру партий/экземпляров без этих правил выбирать рано.
7. **Заказы:** частота/часовой пояс генерации, лимиты, персональная случайность, частичная сдача, срок, отмена, фиксированность награды и потребность в сохранённых случайных seed. Это определяет generationKey и жизненный цикл order.
8. **Торговля:** только прямые сделки или книга заявок, частичные покупки, комиссии, несколько встречных предметов/монет, срок предложения, ограничения новых аккаунтов и self-trade. Предложенная модель рассчитана прежде всего на атомарное полное исполнение одной сделки.
9. **Экономика:** максимальные остатки, источники/расходы монет, возможность покупки валюты, связь с crystals/essence, стратегия начальных остатков. В коде есть crystals/essence, но их обмен с новой игрой не установлен ([UserEntity](../../src/modules/users/domain/entities/user.entity.ts), [CreatorEntity](../../src/modules/creators/domain/entities/creator.entity.ts)).
10. **Эксплуатация:** число экземпляров сервера, пиковая конкуренция, допустимая задержка кредита/истечения, версия и конфигурация production PostgreSQL, доступность фонового процесса, backup/PITR, RPO/RTO, хранение журналов и персональных данных. Локальный [Compose](../../compose.yml) этого не определяет.
11. **Состояние репозитория и БД:** какие локальные незакоммиченные изменения войдут в базовую версию, применены ли перенесённые core-миграции и есть ли zoo-таблицы вне миграций? Нужны данные целевого окружения; текущий аудит отражает рабочее дерево, а не гарантированное состояние deploy ([knexfile](../../knexfile.ts), [AppModule](../../src/app.module.ts)).

До согласования этих решений реализацию игры и изменение схемы/конфигурации не начинать.
