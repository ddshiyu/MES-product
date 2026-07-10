# MES 生产执行系统

面向加工行业现场执行场景的平板端 / 小程序端 MES 应用。系统围绕生产指令单展开，覆盖生产统计、指令查看、扫码上机、母材校验、过程质检、权限分配和登录退出。

## 项目定位

目标用户主要是班组长、质检员和管理员。应用重点不是通用后台管理，而是机台现场的快速执行：

- 班组长快速查看生产指令、扫码校验母材、确认上机、记录或清除异常。
- 质检员录入整条产品厚度和分组宽度检测结果，并提交质检结论。
- 管理员维护账号和角色，控制用户可访问页面和可执行操作。
- 统计页汇总生产状态、质检结果和异常追踪。

## 技术栈

- uni-app
- Vue 3
- TypeScript
- Vite
- Pinia
- ESLint
- H5 与微信小程序构建目标

## 目录结构

```text
miniprogram/
├── README.md
├── package.json
├── package-lock.json
├── pnpm-lock.yaml
├── vite.config.ts
├── .env.development
├── .env.production
├── dist/
│   ├── build/
│   └── dev/
└── src/
    ├── api/
    │   └── mes.ts
    ├── pages/
    │   ├── login/
    │   │   └── index.vue
    │   ├── stats/
    │   │   └── index.vue
    │   ├── orders/
    │   │   └── index.vue
    │   ├── inspection/
    │   │   └── index.vue
    │   └── access/
    │       └── index.vue
    ├── static/
    │   └── logo.png
    ├── stores/
    │   ├── app.ts
    │   ├── auth.ts
    │   └── order.ts
    ├── types/
    ├── utils/
    ├── App.vue
    ├── env.d.ts
    ├── main.ts
    ├── manifest.json
    ├── pages.json
    └── uni.scss
```

## 页面说明

| 页面 | 路由 | 说明 |
|---|---|---|
| 登录页 | `pages/login/index` | 账号密码登录，登录成功后进入统计页 |
| 统计页 | `pages/stats/index` | 展示指令总数、合格率、异常订单、待处理、状态分布、质检结果和数据同步信息 |
| 指令页 | `pages/orders/index` | 展示生产指令列表、状态筛选、指令详情、分切方案、母材校验、扫码模拟、确认上机、异常记录与清除 |
| 质检页 | `pages/inspection/index` | 录入厚度、分组宽度、质检状态和异常说明，并提交质检结果 |
| 权限页 | `pages/access/index` | 新增账号、分配角色、查看角色权限说明 |

页面顺序定义在 `miniprogram/src/pages.json`，当前启动页为统计页。

## 核心业务流程

1. 用户登录后保存本地登录态。
2. 进入统计页查看今日或本周生产状态。
3. 班组长进入生产指令页，新增或选择指令。
4. 点击 QR 扫码模拟母材数据，系统对比材质、厚度、宽度和重量。
5. 校验通过后确认上机，指令进入待质检。
6. 质检员进入质检页，填写厚度和分组宽度。
7. 提交质检结果后，合格指令进入完成，不合格或返工进入异常。
8. 管理员在权限页新增账号并分配角色。

## 状态管理

项目使用 Pinia 管理跨页面状态，页面内临时表单仍保留在页面组件中，避免把输入框、弹窗开关等局部状态放入全局。

| Store | 文件 | 负责数据 | 使用场景 |
|---|---|---|---|
| `authStore` | `src/stores/auth.ts` | `token`、当前用户、角色、权限码、登录状态 | 登录、退出、页面权限、按钮权限 |
| `orderStore` | `src/stores/order.ts` | 当前指令、指令筛选、搜索关键字、扫码结果 | 统计页跳指令页、指令页筛选、质检页读取当前待质检指令 |
| `appStore` | `src/stores/app.ts` | 当前导航、设备类型、顶部和底部安全区 | H5 / 小程序 / 平板的布局适配 |

### 登录态

登录成功后调用 `authStore.login()`，内部会请求 `mesLogin` 并写入本地存储：

- `mes_token`
- `mes_user`

退出登录统一调用 `authStore.logout()`，清除本地登录态后跳转到登录页。退出入口在统计、指令、质检和权限页均可见，避免没有权限页入口的角色无法退出。

### 指令上下文

`orderStore` 保存当前选中的生产指令和筛选条件：

- `currentTab`：当前状态筛选。
- `searchKeyword`：指令页搜索关键字。
- `selectedOrderNo`：当前选中指令号。
- `selectedOrderStatus`：当前选中指令状态。
- `scannedMaterials`：按指令号缓存的扫码结果。

统计页点击异常记录时会写入 `orderStore`，再跳转到指令页。质检页没有 URL 参数时，会优先读取 `orderStore.selectedPendingInspectionOrderNo`，避免只能依赖接口默认第一条待质检指令。

## 权限管理

权限由后端角色和权限码驱动，前端通过 `authStore` 读取当前账号的角色和权限，控制页面入口和操作按钮；后端接口通过权限中间件再次校验，避免只依赖前端隐藏按钮。

### 权限码

| 权限码 | 类型 | 模块 | 说明 |
|---|---|---|---|
| `stats:view` | 页面 | `stats` | 查看统计看板 |
| `orders:view` | 页面 | `orders` | 查看生产指令 |
| `orders:load` | 操作 | `orders` | 新增订单、扫码、确认上机 |
| `orders:exception` | 操作 | `orders` | 记录和清除指令异常 |
| `inspection:view` | 页面 | `inspection` | 查看过程质检 |
| `inspection:submit` | 操作 | `inspection` | 提交质检结果 |
| `access:view` | 页面 | `access` | 查看权限管理 |
| `access:manage` | 操作 | `access` | 新增账号、分配角色 |

### 角色权限

| 角色 | 页面权限 | 主要操作 |
|---|---|---|
| 管理员 | 统计、指令、质检、权限 | 新增账号、分配角色、查看统计、生产和质检全部操作 |
| 班组长 | 统计、生产指令 | 新增订单、扫码上机、确认上机、记录和清除异常 |
| 质检员 | 统计、过程质检 | 提交质检结果 |
| 主管 | 统计 | 查看生产状态和统计结果 |

### 前端控制

前端通过 `authStore.canAccessPage(pageKey)` 过滤侧边栏和底部导航，通过 `authStore.can(permissionCode)` 控制按钮：

- 指令页：`orders:load` 控制新增订单、QR 扫码、确认上机。
- 指令页：`orders:exception` 控制记录异常、清除异常。
- 质检页：`inspection:submit` 控制提交质检。
- 权限页：`access:manage` 控制新增账号、保存角色。

若用户直接访问无权限页面，页面会提示无权限并跳回统计页或登录页。

### 后端校验

后端在 `/Users/wolffy/Desktop/personal/acpistocs-project/server/routes/mes/accessControl.js` 中提供 `requireMesPermission(permissionCode)` 中间件。MES 路由按接口动作绑定权限码：

- `/api/mes/stats/dashboard`：`stats:view`
- `/api/mes/orders/page`、`/api/mes/orders/detail`：`orders:view`
- `/api/mes/orders/add`、`/api/mes/orders/update`、`/api/mes/orders/delete`、`/api/mes/orders/confirm-load`：`orders:load`
- `/api/mes/orders/exception`、`/api/mes/orders/close-exception`：`orders:exception`
- `/api/mes/inspections/detail`：`inspection:view`
- `/api/mes/inspections/submit`：`inspection:submit`
- `/api/mes/users/*`、`/api/mes/roles/list`、`/api/mes/permissions/list`：按 `access:view` 或 `access:manage` 校验

JWT 中包含当前用户的 `roles` 和 `permissions`，接口校验直接读取 `req.user.permissions`。

## 接口说明

前端接口统一封装在：

```text
miniprogram/src/api/mes.ts
```

主要能力包括：

- 登录：`mesLogin`
- 用户与角色：`getMesUsers`、`createMesUser`、`assignMesUserRole`、`getMesRoles`
- 指令：`getMesOrders`、`getMesOrderDetail`、`createMesOrder`
- 上机：`confirmMesOrderLoad`
- 指令异常：`createMesOrderException`、`closeMesOrderException`
- 质检：`getMesInspectionDetail`、`submitMesInspection`
- 统计：`getMesStatsDashboard`

开发环境接口基地址在 `miniprogram/.env.development`：

```env
VITE_APP_BASE_API = /api
VITE_APP_API_ORIGIN = https://localhost
VITE_MES_API_PROXY_TARGET = https://localhost
```

H5 开发时 `/api` 通过 `miniprogram/vite.config.ts` 代理到 `VITE_MES_API_PROXY_TARGET`。小程序端不支持 `/api` 相对地址，接口请求会使用 `VITE_APP_API_ORIGIN` 拼成完整 URL。

本项目当前使用真实后端接口和数据库表，不使用前端 Mock 数据。业务数据由后端 `/api/mes` 路由读写，前端只在接口不可用的个别演示场景中做本地兜底提示。

## 数据库表设计

MES 相关表统一使用 `mes_` 前缀，分为权限账号、生产指令、上机扫码、过程质检和异常追踪几类。当前后端模型位于：

```text
/Users/wolffy/Desktop/personal/acpistocs-project/server/models/mes
```

### 权限与账号

#### `mes_users`

账号表，用于登录和人员身份识别。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `username` | STRING | 登录账号，唯一 |
| `passwordHash` | STRING(255) | 密码哈希 |
| `realName` | STRING | 姓名 |
| `phone` | STRING | 手机号，可空 |
| `status` | ENUM | `active` / `disabled` |
| `lastLoginAt` | DATE | 最近登录时间 |
| `createdAt` / `updatedAt` | DATE | 创建和更新时间 |

#### `mes_roles`

角色表，内置管理员、班组长、质检员、主管。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `code` | STRING | 角色编码，唯一 |
| `name` | STRING | 角色名称 |
| `description` | STRING | 角色说明 |
| `sortOrder` | INTEGER | 排序 |

#### `mes_permissions`

权限点表，区分页面、操作和数据权限。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `code` | STRING | 权限编码，唯一 |
| `name` | STRING | 权限名称 |
| `module` | STRING | 所属模块 |
| `type` | ENUM | `page` / `action` / `data` |
| `description` | STRING | 权限说明 |

#### `mes_user_roles`

用户与角色关联表。

| 字段 | 类型 | 说明 |
|---|---|---|
| `userId` | INTEGER | 用户 ID |
| `roleId` | INTEGER | 角色 ID |

唯一索引：`userId + roleId`。

#### `mes_role_permissions`

角色与权限关联表。

| 字段 | 类型 | 说明 |
|---|---|---|
| `roleId` | INTEGER | 角色 ID |
| `permissionId` | INTEGER | 权限 ID |

唯一索引：`roleId + permissionId`。

### 生产指令

#### `mes_production_orders`

生产指令主表，是业务主状态的核心表。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `orderNo` | STRING | 指令号，唯一 |
| `customerName` | STRING | 客户名称 |
| `machineCode` | STRING | 机台编号 |
| `material` | STRING | 材质 |
| `thickness` | DECIMAL(10,2) | 厚度 |
| `width` | DECIMAL(10,2) | 宽度 |
| `weight` | DECIMAL(10,2) | 重量 |
| `dueDate` | DATEONLY | 交期 |
| `status` | ENUM | `pending_load` / `pending_inspection` / `exception` / `done` |
| `priority` | INTEGER | 优先级 |
| `assignedUserId` | INTEGER | 指派人员，可空 |
| `remark` | TEXT | 备注 |

索引：`orderNo`、`status`、`machineCode`、`dueDate`。

#### `mes_order_split_items`

分切方案明细表，一条生产指令可包含多组分切目标。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `orderId` | INTEGER | 生产指令 ID |
| `groupNo` | STRING | 分组号，如 `G01` |
| `targetWidth` | DECIMAL(10,2) | 目标宽度 |
| `quantity` | INTEGER | 卷数 |
| `tolerance` | STRING | 公差，如 `±0.5mm` |
| `sortOrder` | INTEGER | 排序 |

索引：`orderId`。

### 上机与母材校验

#### `mes_material_scan_records`

母材扫码记录表，保存扫码得到的母卷信息和匹配结果。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `orderId` | INTEGER | 生产指令 ID |
| `coilCode` | STRING | 母卷码 |
| `material` | STRING | 扫码材质 |
| `thickness` | DECIMAL(10,2) | 扫码厚度 |
| `width` | DECIMAL(10,2) | 扫码宽度 |
| `weight` | DECIMAL(10,2) | 扫码重量 |
| `matched` | BOOLEAN | 是否匹配指令要求 |
| `mismatchReason` | STRING | 不匹配原因 |
| `scannedBy` | INTEGER | 扫码人 |
| `scannedAt` | DATE | 扫码时间 |

索引：`orderId`、`coilCode`。

### 过程质检

#### `mes_inspection_records`

质检主记录表，记录整条产品厚度和最终质检结论。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `orderId` | INTEGER | 生产指令 ID |
| `inspectorId` | INTEGER | 质检员 ID |
| `thicknessValue` | DECIMAL(10,2) | 检测厚度 |
| `thicknessResult` | ENUM | `pass` / `fail` / `review` |
| `finalResult` | ENUM | `pass` / `fail` / `rework` / `review` |
| `abnormalNote` | TEXT | 异常说明 |
| `status` | ENUM | `submitted` / `confirmed` |
| `submittedAt` | DATE | 提交时间 |

索引：`orderId`、`inspectorId`、`finalResult`。

#### `mes_inspection_width_groups`

质检分组宽度记录表，记录每个分切组的实际宽度和结果。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `inspectionId` | INTEGER | 质检记录 ID |
| `splitItemId` | INTEGER | 分切方案明细 ID，可空 |
| `groupNo` | STRING | 分组号 |
| `targetWidth` | DECIMAL(10,2) | 目标宽度 |
| `actualWidth` | DECIMAL(10,2) | 实际宽度 |
| `diffValue` | DECIMAL(10,2) | 偏差值 |
| `result` | ENUM | `pass` / `fail` / `review` |
| `note` | STRING | 说明 |

索引：`inspectionId`、`splitItemId`、`result`。

### 异常追踪

#### `mes_exception_records`

异常记录表，统一承接母材不匹配、质检不合格、返工和人工记录的异常。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER | 主键 |
| `orderId` | INTEGER | 生产指令 ID |
| `sourceType` | ENUM | `material_scan` / `inspection` / `manual` |
| `sourceId` | INTEGER | 来源记录 ID，可空 |
| `exceptionType` | STRING | 异常类型 |
| `description` | TEXT | 异常说明 |
| `status` | ENUM | `pending` / `processing` / `closed` |
| `ownerRole` | STRING | 责任角色 |
| `ownerUserId` | INTEGER | 责任人，可空 |
| `createdBy` | INTEGER | 创建人 |
| `closedAt` | DATE | 关闭时间 |

索引：`orderId`、`status`。

### 表关系

- `mes_users` 与 `mes_roles` 多对多，通过 `mes_user_roles` 关联。
- `mes_roles` 与 `mes_permissions` 多对多，通过 `mes_role_permissions` 关联。
- `mes_production_orders` 一对多关联 `mes_order_split_items`。
- `mes_production_orders` 一对多关联 `mes_material_scan_records`。
- `mes_production_orders` 一对多关联 `mes_inspection_records`。
- `mes_inspection_records` 一对多关联 `mes_inspection_width_groups`。
- `mes_order_split_items` 一对多关联 `mes_inspection_width_groups`。
- `mes_production_orders` 一对多关联 `mes_exception_records`。

### 状态与数据流

1. 新增生产指令写入 `mes_production_orders`，分切方案写入 `mes_order_split_items`。
2. 班组长扫码上机写入 `mes_material_scan_records`。
3. 母材匹配成功时，指令状态从 `pending_load` 变为 `pending_inspection`。
4. 母材匹配失败或手动记录异常时，写入 `mes_exception_records`，指令状态变为 `exception`。
5. 质检员提交质检时，写入 `mes_inspection_records` 和 `mes_inspection_width_groups`。
6. 质检合格时，指令状态变为 `done`。
7. 质检不合格或返工时，写入 `mes_exception_records`，指令状态变为 `exception`。
8. 异常清除后，根据最新扫码匹配状态恢复为 `pending_inspection` 或 `pending_load`。

## 安装与启动

进入前端目录：

```bash
cd miniprogram
```

安装依赖：

```bash
npm install
```

启动 H5 开发环境：

```bash
npm run dev:h5
```

构建 H5：

```bash
npm run build:h5
```

构建微信小程序：

```bash
npm run build:mp-weixin
```

构建后使用微信开发者工具导入：

```text
miniprogram/dist/build/mp-weixin
```

## 代码检查

执行 ESLint 检查：

```bash
npm run lint:check
```

自动修复可修复问题：

```bash
npm run lint
```

当前项目中 `src/utils/request.ts` 可能存在历史 warning，不影响主业务页面构建。

## 响应式适配

项目面向平板和小程序端，当前样式覆盖：

- 桌面 / 平板：左侧固定导航，右侧内容区。
- 移动端：底部导航，内容区预留安全距离。
- 小程序端：使用自定义导航样式，并为顶部状态栏预留空间。
- iPad / 大屏：统计、指令、质检、权限页面均使用响应式栅格。

## 状态说明

生产指令主要状态：

- `pending_load`：待上机
- `pending_inspection`：待质检
- `exception`：异常
- `done`：已完成

质检结果：

- `pass`：合格
- `fail`：不合格
- `review`：复核
- `rework`：返工

## 验收建议

交付前建议至少验证：

- H5 可正常启动并访问所有主页面。
- 微信小程序可完成构建并导入开发者工具。
- 登录、退出登录、权限页新增账号流程可用。
- 指令页筛选、随机新增订单、扫码模拟、确认上机、异常记录和清除可用。
- 质检页只保留提交质检结果流程。
- 统计页数据与指令、质检、异常状态一致。
- 移动端和 iPad 尺寸下顶部、底部安全距离无明显遮挡。

## 参考文档

- 项目分析报告：`output/pdf/mes_project_analysis.md`
