# AI 智能工单系统 - 前端待办清单

## 项目信息
- **技术栈**: Vue 3 + Vite + TypeScript + Element Plus
- **API 网关**: http://localhost:8080
- **认证方式**: JWT (存 localStorage，请求头携带 X-User-Id / X-User-Name)

---

## 一、项目初始化

- [ ] 初始化 Vue 3 + Vite + TypeScript 项目
- [ ] 安装依赖: vue-router, pinia, axios, element-plus, @element-plus/icons-vue
- [ ] 配置 ESLint + Prettier
- [ ] 配置路径别名 (@/ → src/)

---

## 二、架构基础设施

- [ ] 路由配置 (vue-router)
  - `/login` - 登录页
  - `/register` - 注册页
  - `/` - 主页（跳转到 /tickets）
  - `/tickets` - 工单列表
  - `/tickets/new` - 创建工单
  - `/tickets/:id` - 工单详情
  - `/my-tickets` - 我的工单
  - `/pending` - 待处理工单
  - `/knowledge` - 知识库
  - `/admin/users` - 用户管理 (管理员)
  - `/admin/stats` - 统计分析 (管理员)

- [ ] Pinia store
  - `useAuthStore` - 认证状态 (token, userInfo, login/logout)
  - `useTicketStore` - 工单状态缓存
  - `useAppStore` - 全局状态 (侧边栏折叠等)

- [ ] Axios 封装
  - 基础配置 (baseURL: /api)
  - 请求拦截器 (添加 JWT token, X-User-Id, X-User-Name)
  - 响应拦截器 (统一错误处理, 401 跳转登录)
  - 接口模块化 (auth.ts, user.ts, ticket.ts, ai.ts)

---

## 三、页面组件

### 3.1 认证模块
- [ ] LoginPage - 登录页
  - 用户名/密码表单
  - 登录按钮 loading 状态
  - 错误提示
  - 跳转到注册链接

- [ ] RegisterPage - 注册页
  - 用户名/邮箱/密码/昵称表单
  - 密码确认
  - 注册按钮 loading 状态
  - 成功跳转登录

### 3.2 工单模块

- [ ] TicketList - 工单列表页
  - 顶部统计卡片 (待处理/处理中/已解决/已关闭)
  - 筛选栏 (状态/分类/优先级/时间范围)
  - 搜索框 (关键词搜索)
  - 工单表格
    - 列表项: ID, 标题, 分类, 优先级, 状态, 处理人, 创建时间
    - 优先级标签颜色: P0(红), P1(橙), P2(蓝), P3(灰)
    - 状态标签颜色: open(黄), processing(蓝), resolved(绿), closed(灰)
    - 操作: 查看详情
  - 分页组件
  - 新建工单按钮

- [ ] TicketDetail - 工单详情页
  - 工单头部信息
    - ID + 标题 + 分类标签 + 优先级标签 + 状态标签
    - 创建人/处理人/创建时间/耗时
  - AI 摘要卡片 (如果已生成)
  - 对话 Timeline
    - 用户消息 (右侧，蓝色气泡)
    - 处理人消息 (左侧，灰色气泡)
    - AI 建议消息 (左侧，带 💡 图标)
    - 参考来源可点击
  - 操作栏 (根据状态显示不同按钮)
    - 待处理: 开始处理, 分配给我
    - 处理中: 回复, 转交, 标记已解决
    - 已解决: 重新打开
  - 回复输入框 (支持 Enter 发送, Ctrl+Enter 换行)

- [ ] TicketCreate - 创建工单页
  - 表单: 标题, 问题描述(富文本/textarea)
  - 附件上传 (最多5张图片, PDF/Word/Excel)
  - 紧急程度选择 (normal/urgent/critical)
  - AI 实时分析区 (创建时自动调用)
    - 分类建议 + 置信度进度条
    - 优先级评估 + 因素展示
    - 推荐处理人 + 匹配度
    - AI 摘要预览
  - 提交按钮

### 3.3 我的工单 / 待处理

- [ ] MyTickets - 我的工单页 (复用 TicketList，过滤 creatorId=当前用户)
- [ ] PendingTickets - 待处理工单页 (复用 TicketList，过滤 handlerId=当前用户)

### 3.4 知识库

- [ ] KnowledgePage - 知识库页
  - 搜索栏
  - 知识列表 (标题/分类/来源/状态)
  - 详情弹窗

### 3.5 管理后台

- [ ] UserManagePage - 用户管理页 (管理员)
  - 用户列表 (分页)
  - 角色标签 (USER/HANDLER/ADMIN)
  - 编辑用户弹窗
  - 技能画像卡片

- [ ] StatsPage - 统计分析页 (管理员)
  - 统计卡片 (总数/待处理/处理中/已解决)
  - 可能留空或简单图表

### 3.6 布局组件

- [ ] AppLayout - 整体布局
  - 顶部导航栏 (Logo, 用户名, 退出按钮)
  - 左侧菜单
    - 工单管理 (工单列表, 我的工单, 待处理)
    - 知识库
    - 管理 (用户管理, 统计分析) - 仅管理员可见
  - 主内容区
  - 响应式 (移动端折叠侧边栏)

- [ ] EmptyState - 空状态组件
- [ ] LoadingState - 加载状态组件
- [ ] ErrorState - 错误状态组件

---

## 四、AI 能力展示组件

- [ ] AIClassifyBadge - AI 分类标签
  - 显示分类名称 + 置信度百分比
  - 环形进度条可视化

- [ ] AIPriorityTag - AI 优先级标签
  - P0/P1/P2/P3 彩色标签
  - hover 显示评估因素

- [ ] AIHandlerCard - 推荐处理人卡片
  - 姓名 + 技能标签 + 匹配度
  - 当前负载 (3/10)
  - 推荐理由

- [ ] AISuggestBox - AI 建议回复框
  - 参考来源列表 (可点击)
  - 建议回复内容
  - 采纳/修改 按钮

- [ ] AISummaryCard - AI 摘要卡片
  - 摘要文本
  - 关键信息
  - 解决方案 (如果有)

---

## 五、交互细节

- [ ] 表单验证 (统一错误提示)
- [ ] 按钮 loading 状态 (防止重复提交)
- [ ] 表格 loading skeleton
- [ ] 消息通知 (Element Plus Message)
  - 成功: 绿色
  - 错误: 红色
  - 警告: 黄色
- [ ] 确认对话框 (Element Plus Confirm)
  - 删除工单
  - 关闭工单
- [ ] 键盘快捷键
  - Enter 发送消息
  - Esc 关闭弹窗
- [ ] 深色模式支持 (CSS Variables)
- [ ] 响应式布局 (支持 1440/1920)

---

## 六、样式规范

- [ ] 全局 CSS Variables (颜色/字体/间距)
- [ ] 统一卡片阴影
- [ ] 统一圆角 (8px)
- [ ] 统一间距 (8px 基准网格)
- [ ] 优先级/状态颜色系统

---

## 七、构建与部署

- [ ] Vite 构建配置
- [ ] 环境变量 (.env.development, .env.production)
- [ ] 打包优化 (code splitting, gzip)
- [ ] 部署路径 (dist/)

---

## 八、Nginx 配置修正

**当前问题**: upstream 端口与服务实际端口不匹配

**修正后的配置**:
```nginx
upstream backend {
    server 127.0.0.1:8080;  # 统一走 API Gateway
}

server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        root   d:/ai-ticket-system-qd/dist;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    # 所有 API 走 gateway
    location /api/ {
        proxy_pass   http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 九、API 接口对照表

### 认证 API
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| POST | /api/v1/auth/register | {username, password, email, nickname?} | UserDTO |
| POST | /api/v1/auth/login | {username, password} | {token, userId, username, role, nickname} |

### 用户 API
| 方法 | 路径 | 参数 | 响应 |
|------|------|------|------|
| GET | /api/v1/users/{id} | - | UserDTO |
| GET | /api/v1/users | ?page&pageSize&role | PageResult<UserDTO> |
| PUT | /api/v1/users/{id} | UserDTO | UserDTO |
| DELETE | /api/v1/users/{id} | - | void |
| GET | /api/v1/users/{id}/skill | - | UserSkillDTO |
| PUT | /api/v1/users/{id}/skills | UpdateSkillRequest | UserSkillDTO |
| GET | /api/v1/users/handlers | - | List<UserDTO> |
| GET | /api/v1/users/handlers/available | - | List<UserSkillDTO> |

### 工单 API
| 方法 | 路径 | 参数 | 响应 |
|------|------|------|------|
| POST | /api/v1/tickets | CreateTicketRequest (header: X-User-Id, X-User-Name) | TicketDTO |
| GET | /api/v1/tickets/{id} | - | TicketDTO |
| GET | /api/v1/tickets | ?creatorId&handlerId&status&category&priority&keyword&page&pageSize | PageResult<TicketDTO> |
| GET | /api/v1/tickets/my | ?page&pageSize (header: X-User-Id) | PageResult<TicketDTO> |
| GET | /api/v1/tickets/pending | ?page&pageSize (header: X-User-Id) | PageResult<TicketDTO> |
| PUT | /api/v1/tickets/{id} | UpdateTicketRequest | TicketDTO |
| DELETE | /api/v1/tickets/{id} | - | void |
| PUT | /api/v1/tickets/{id}/assign | {handlerId} | TicketDTO |
| PUT | /api/v1/tickets/{id}/start | - | TicketDTO |
| PUT | /api/v1/tickets/{id}/resolve | - | TicketDTO |
| PUT | /api/v1/tickets/{id}/close | - | TicketDTO |
| PUT | /api/v1/tickets/{id}/reopen | - | TicketDTO |
| POST | /api/v1/tickets/{id}/comment | AddCommentRequest (header: X-User-Id, X-User-Name) | CommentDTO |
| GET | /api/v1/tickets/{id}/comments | - | List<CommentDTO> |
| GET | /api/v1/tickets/stats | - | {open, processing, resolved, closed} |

### AI API
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| POST | /api/v1/ai/classify | {content} | {category, confidence, reasoning} |
| POST | /api/v1/ai/priority | {content, urgency} | {priority, score, factors} |
| POST | /api/v1/ai/recommend-handler | {content, category} | {handlerId, handlerName, reason, matchScore} |
| POST | /api/v1/ai/summary | {content} | {summary, keyInfo, solution} |
| POST | /api/v1/ai/suggest-reply | {question, ticketId, context} | {suggestedReply, references} |
| POST | /api/v1/ai/embedding | {text} | {embedding} |
| POST | /api/v1/ai/knowledge | {title, content, category, sourceType, sourceId} | KnowledgeBase |
| PUT | /api/v1/ai/knowledge/{id}/publish | - | KnowledgeBase |
| PUT | /api/v1/ai/knowledge/{id}/archive | - | KnowledgeBase |
| GET | /api/v1/ai/knowledge/search | ?query&limit | List<KnowledgeSearchResult> |

---

## 十、开发优先级

### P0 - 必须
1. 项目初始化 + 路由 + Axios 封装
2. 登录/注册
3. 工单列表 + 筛选 + 分页
4. 工单详情 + 对话
5. 创建工单

### P1 - 重要
6. 我的工单 / 待处理
7. AI 能力可视化组件
8. 用户管理 (管理员)

### P2 - 增强
9. 知识库
10. 深色模式
11. 响应式适配

---

**文档更新**: 2026-04-09
