# Vercel + Supabase 部署与验收

本轮实现第一个里程碑：邮箱登录、账号隔离的学习记录、幂等同步、本地历史导入和跨设备恢复。前端仍是 React + Vite；Vercel 运行 `api/learning.ts`，Supabase 提供 Auth 和 PostgreSQL。复习调度、运营看板及课程管理后台属于后续功能。

**代码通过本地检查后，仍需创建 Supabase 项目、配置邮件和环境变量，才能验收真实登录与云端同步。** 未配置时保留游客学习，不显示虚假的“已同步”。

## 1. 准备 Supabase 项目

建议开发／Vercel Preview 使用测试项目，正式 Production 使用生产项目。先在测试项目完成全部验收，再配置生产环境。

1. 在 Supabase Dashboard 创建项目，选择接近主要用户和 Vercel 业务函数的数据库区域。
2. 在项目的 API Keys 设置中取得 Project URL、publishable key 和 secret key。secret key 只放服务端，不能发送给浏览器，也不要提交 Git。
3. 在测试项目 SQL Editor 执行 [`202611160001_learning_sync.sql`](../supabase/migrations/202611160001_learning_sync.sql)。也可用 Supabase CLI 管理迁移；生产发布应保留迁移历史。
4. 确认建立了 `qalam_learning_events`、`qalam_legacy_imports` 两张表及 `qalam_append_learning`、`qalam_import_learning`、`qalam_pull_learning` 三个函数。

两表都启用 RLS。登录用户只能直接读取自己的行，匿名用户无权读取；浏览器无权直接写表或调用上述业务 RPC。Vercel 使用服务器密钥调用 RPC，因此接口会先向 Auth 验证用户 JWT，再由验证结果确定 `user_id`。服务器密钥能绕过 RLS，不能把任意客户端 `user_id` 传给它使用。

参考：[Supabase 密钥](https://supabase.com/docs/guides/getting-started/api-keys)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## 2. 配置登录邮件

在 Supabase Authentication 中启用 Email 登录与新用户注册。验证码登录需要邮件模板包含 `{{ .Token }}`，不能只保留登录链接。

在邮件模板设置中检查 **Magic Link** 模板；也检查项目实际用于新用户的确认邮件模板。发送邮件后，用户把收到的数字验证码填回应用。正式使用前配置自己的 SMTP，并以真实邮箱验证发送、收件、过期、错误码与重发行为。默认测试邮件服务有发送限制，不应把“API 返回成功”当作所有用户都能收到邮件的证明。

Site URL 设置为正式网站地址；允许的 Redirect URLs 仅添加实际使用的本地／测试／正式地址。当前数字验证码流程不依赖任意外部回调地址。

参考：[邮箱 OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[SMTP](https://supabase.com/docs/guides/auth/auth-smtp)。

## 3. 配置本地与 Vercel 环境变量

复制仓库的 `.env.example` 为 `.env.local`，在本机填写。`.env.local` 被 Git 忽略。不要把密钥写进源码、README、截图或对话。

| 变量 | 使用位置 | 说明 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 浏览器与服务端 | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 浏览器与服务端 | 可以公开的 publishable key |
| `SUPABASE_URL` | 仅服务端 | Project URL；不设置时复用 `VITE_SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | 仅服务端 | 服务器 secret key，绝不能带 `VITE_` 前缀 |

服务端兼容 `SUPABASE_PUBLISHABLE_KEY` 与旧式 `SUPABASE_SERVICE_ROLE_KEY`，新项目建议使用上表的新式密钥。新式 `sb_secret_…` 通过 `apikey` 请求头发送，不作为用户的 Bearer JWT。

**所有 `VITE_` 变量都会进入构建后的浏览器代码。** 把管理密钥误命名为 `VITE_…` 会使它公开。修改 Vercel 的前端环境变量后，需要重新部署以更新构建结果。

已有 Vercel 项目可继续连接当前 GitHub 仓库：

- Framework Preset：Vite。
- Build Command：`npm run build`。
- Output Directory：`dist`。
- Node.js：使用项目要求的受支持版本，建议 24 系。
- Development／Preview 填测试 Supabase 配置，Production 填生产配置。
- 确认函数区域靠近数据库；迁移 SQL 成功后再发布对应 API。

仓库的 [`vercel.json`](../vercel.json) 配置了前端构建和业务函数。当前页面通过组件状态切换，不需要把 `/api/*` 重写到 `index.html`。

参考：[Vite 部署](https://vercel.com/docs/frameworks/frontend/vite)、[Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js)。

## 4. 本地运行与检查

```bash
npm ci
npm test
npm run lint
npm run build
```

`npm run dev` 用于只调试 Vite 前端。包含 `/api/learning` 的联调使用 Vercel 本地开发环境：

```bash
npx vercel dev
```

首次使用 Vercel CLI 时，关联已有的 Vercel 项目，并确认本地环境变量指向测试数据库。仅运行 Vite 不会自动启动 Vercel API。参考：[vercel dev](https://vercel.com/docs/cli/dev)。

API mock 测试会覆盖身份核验、输入验证、判题、分页协议及历史导入；数据库测试覆盖实际 SQL、权限和幂等性。这些检查不会替代真实邮箱、真实 Vercel 函数和 Supabase 网络联调。

## 5. 数据与接口语义

### `/api/learning`

所有请求携带 `Authorization: Bearer <用户 access token>`，响应不允许公共缓存。

- `GET ?cursor=0`：返回 `{ changes, nextCursor, hasMore }`。每页最多 200 条，客户端持续分页直到 `hasMore=false`；云端历史不会截断为旧版的最近 500 轮。
- `POST { events: [...] }`：每批 1–100 条，事务写入。每次作答／操作的 UUID 在重试时保持不变，数据库以账号与 UUID 去重。
- `POST { import: { id, snapshot } }`：导入冻结的旧本地快照。重复上传同一导入 ID 不会重复累计。单次请求上限 1 MiB。

两张表共用服务端递增序号。每个账号的写事务取得相同锁后才分配序号，保证游标不会跳过该账号尚未提交的低序号记录。客户端发生时间与 `received_at`（服务器接收时间）分开保存，设备时间和提示使用情况仍是客户端自报信息。

新记录包括逐题作答、整轮汇总、错词与手动移除／清空、偏好、Tajweed 结果。`attempt.result` 由服务端重新计算，客户端传入的判题结果会被忽略。`session` 汇总和旧成绩始终是 `client_reported`／`legacy_import`，不是经过认证的技能证明。

历史导入保留旧数据实际拥有的信息：没有逐题答案就不补造；没有版本就标为未版本化；导入本身不算作新的真实练习。Tajweed 仍只表示规则辨识，不计入打字速度或发音合格指标。

首次导入使用浏览器 Web Locks 在多个标签页之间锁定同一份导入凭据，避免重复累计或绑定到不同账号。请使用支持 Web Locks 的浏览器，并通过 HTTPS（本地可用 localhost）访问；不支持时会提示无法安全导入，原始游客记录仍保留。

“清空历史／错题”是同步到各设备的显示状态操作，不等于物理删除服务器审计日志。当前里程碑没有自助删除账号界面；管理员在 Supabase 删除 Auth 用户时，外键会级联删除该用户的上述两表记录。产品以后提供账号删除功能时，应明确这个区别。

### 内容版本

`shared/catalog.ts` 为当前收录内容生成稳定 ID 和当前 `CONTENT_VERSION`，服务端按当前快照核对最终答案。文字比较适配目前可选动符的练习方式；它不证明首次独立答对、语音准确或长期掌握。

**当前只内置一个版本的判题快照。** 修改答案或判题规则时必须更新 `CONTENT_VERSION`，不能沿用旧版本改写历史判定。发布内容更新前应确认待同步队列处理方式；需要长期支持离线旧版本时，应先加入保留历史快照的机制。未知题目／版本返回 `409 content_unavailable`，附 `eventId`；客户端保留待同步记录和错误提示，不能默默当作成功或给它编造分数。

## 6. 发布前逐项验收

在测试 Supabase + Vercel Preview 上完成：

1. 游客完成练习，登录并明确导入本地历史；另一浏览器登录同一账号能恢复。
2. 同一快照重复导入、同一请求重复发送，记录条数与累计结果不增长。
3. 上传时断网、刷新、重试，本地待同步记录仍在，恢复网络后继续。
4. 两台设备同时练习，两个结果都保留，不发生整包覆盖。
5. 账号 A 退出后进入账号 B，不显示或自动导入 A 的缓存；B 也不能访问 A 的 API 数据。
6. 校验错误、过期验证码、登录失效、迁移未执行、服务器暂不可用时，都有可理解的提示。
7. Tajweed 分数恢复后仍显示“规则辨识”，不出现发音达标或打字统计。
8. 内容版本不匹配时可看到待同步失败原因，原记录仍保存。

先小范围试用，再根据真实失败和使用表现扩展。正式数据应安排备份与恢复演练；免费 Supabase 方案需要自行导出备份，不能假定自动备份已开启。[备份说明](https://supabase.com/docs/guides/platform/backups)。
