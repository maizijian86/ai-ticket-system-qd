<template>
  <div class="ticket-list">
    <div class="page-header">
      <h2>工单列表</h2>
      <el-button type="primary" @click="router.push('/tickets/new')" class="btn-glass btn-glass-primary">
        <el-icon><Plus /></el-icon> 新建工单
      </el-button>
    </div>

    <!-- 统计卡片（可点击筛选） -->
    <div class="stats-cards">
      <div
        class="stat-card glass-card"
        :class="{ active: activeStatus === 'OPEN' }"
        @click="handleStatusFilter('OPEN')"
      >
        <div class="stat-icon stat-icon-pending">
          <el-icon size="24"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mine && activeStatus === 'OPEN' ? mineStats.open : stats.open }}</div>
          <div class="stat-label">待接单</div>
        </div>
        <div class="stat-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div
        class="stat-card glass-card"
        :class="{ active: activeStatus === 'ACCEPTED' }"
        @click="handleStatusFilter('ACCEPTED')"
      >
        <div class="stat-icon stat-icon-processing">
          <el-icon size="24"><Loading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mine && activeStatus === 'ACCEPTED' ? mineStats.accepted : stats.accepted }}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="stat-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div
        class="stat-card glass-card"
        :class="{ active: activeStatus === 'PENDING_APPROVAL' }"
        @click="handleStatusFilter('PENDING_APPROVAL')"
      >
        <div class="stat-icon stat-icon-pending-approval">
          <el-icon size="24"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mine && activeStatus === 'PENDING_APPROVAL' ? mineStats.pendingApproval : stats.pendingApproval }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <div class="stat-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div
        class="stat-card glass-card"
        :class="{ active: activeStatus === 'COMPLETED' }"
        @click="handleStatusFilter('COMPLETED')"
      >
        <div class="stat-icon stat-icon-resolved">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mine && activeStatus === 'COMPLETED' ? mineStats.completed : stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
</div>

    <!-- 筛选栏 -->
    <el-card class="filter-card glass-card-static">
      <!-- 处理中子Tab（无筛选表单） -->
      <div v-if="activeStatus === 'ACCEPTED'" class="accepted-sub-tabs">
        <button
          :class="['sub-tab', acceptedTab === 'my-accepted' ? 'active' : '']"
          @click="setAcceptedTab('my-accepted')"
        >
          我接的单
        </button>
        <button
          :class="['sub-tab', acceptedTab === 'my-created' ? 'active' : '']"
          @click="setAcceptedTab('my-created')"
        >
          我创建的
        </button>
      </div>
      <!-- 其他状态显示完整筛选表单 -->
      <el-form v-else :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态" class="glass-form-item">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px" class="glass-input">
            <el-option label="待接单" value="OPEN" />
            <el-option label="处理中" value="ACCEPTED" />
            <el-option label="待审批" value="PENDING_APPROVAL" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已拒绝" value="REJECTED" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" class="glass-form-item">
          <el-select v-model="filters.category" placeholder="全部" clearable style="width: 120px" class="glass-input">
            <el-option label="Bug" value="BUG" />
            <el-option label="咨询" value="CONSULT" />
            <el-option label="投诉" value="COMPLAINT" />
            <el-option label="建议" value="SUGGESTION" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" class="glass-form-item">
          <el-select v-model="filters.priority" placeholder="全部" clearable style="width: 100px" class="glass-input">
            <el-option label="P0" value="P0" />
            <el-option label="P1" value="P1" />
            <el-option label="P2" value="P2" />
            <el-option label="P3" value="P3" />
          </el-select>
        </el-form-item>
        <el-form-item class="glass-form-item">
          <el-input v-model="filters.keyword" placeholder="关键词" clearable style="width: 140px" class="glass-input" />
        </el-form-item>
        <el-form-item class="glass-form-item">
          <el-button @click="toggleMine" :class="['glass-btn', mine ? 'glass-btn-active' : '']">
            <el-icon><User /></el-icon> 显示我的
          </el-button>
        </el-form-item>
        <el-form-item class="glass-form-item">
          <el-button type="primary" @click="loadTickets" class="btn-glass btn-glass-primary">搜索</el-button>
          <el-button @click="resetFilters" class="btn-glass">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工单卡片网格 -->
    <div class="tickets-grid" v-loading="loading">
      <div
        v-for="ticket in tickets"
        :key="ticket.id"
        class="ticket-card glass-card"
        :class="{ 'ticket-card-mine': ticket.creatorId === authStore.userInfo?.id }"
        @click="handleTicketClick(ticket.id)"
      >
        <div class="ticket-card-header">
          <span class="ticket-id">#{{ ticket.id }}</span>
          <el-tag :type="getStatusType(ticket.status)" size="small" class="glass-tag">
            {{ getStatusLabel(ticket.status) }}
          </el-tag>
        </div>
        <div class="ticket-card-title">{{ ticket.title }}</div>
        <div class="ticket-card-content">{{ ticket.content }}</div>
        <div class="ticket-card-footer">
          <div class="ticket-meta">
            <el-tag v-if="ticket.category" :type="getCategoryType(ticket.category)" size="small" class="glass-tag">
              {{ getCategoryLabel(ticket.category) }}
            </el-tag>
            <span v-if="ticket.priority" :class="`priority-${ticket.priority}`" class="priority-badge">
              {{ ticket.priority }}
            </span>
            <span v-if="ticket.githubRepos?.length" class="repo-badge">
              <el-icon><Folder /></el-icon> {{ ticket.githubRepos.length }}
            </span>
            <span v-if="ticket.price !== undefined && ticket.price !== null" class="price-badge">
              ¥{{ ticket.price.toFixed(0) }}
            </span>
          </div>
          <div class="ticket-time">{{ formatDate(ticket.createdAt) }}</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && tickets.length === 0" class="empty-state">
        <el-icon size="48"><Document /></el-icon>
        <p>暂无工单</p>
      </div>
    </div>

    <!-- 加载更多 / 分页 -->
    <div class="load-more-container" v-if="tickets.length > 0">
      <el-button
        v-if="pagination.page * pagination.pageSize < pagination.total"
        @click="loadMore"
        class="btn-glass load-more-btn"
        :loading="loadingMore"
      >
        加载更多 ({{ pagination.total - tickets.length }} 剩余)
      </el-button>
      <div v-else class="no-more">没有更多了</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ticketApi } from '@/api'
import { useTicketStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { Plus, Clock, Loading, CircleCheck, ArrowRight, Document, Folder, Warning, User } from '@element-plus/icons-vue'
import type { TicketDTO, TicketStatsDTO, TicketStatus, TicketCategory, Priority } from '@/types'

const router = useRouter()
const ticketStore = useTicketStore()
const authStore = useAuthStore()

function handleTicketClick(id: number) {
  if (!authStore.token) {
    ticketStore.triggerAuthModal(`/tickets/${id}`)
  } else {
    router.push(`/tickets/${id}`)
  }
}

const tickets = ref<TicketDTO[]>([])
const stats = ref<TicketStatsDTO>({ open: 0, accepted: 0, pendingApproval: 0, completed: 0 })
const mineStats = ref<TicketStatsDTO>({ open: 0, accepted: 0, pendingApproval: 0, completed: 0 })
const loading = ref(false)
const loadingMore = ref(false)
const activeStatus = ref<TicketStatus | ''>('OPEN')
const mine = ref(false)
const acceptedTab = ref<'my-accepted' | 'my-created'>('my-accepted')

function setAcceptedTab(tab: 'my-accepted' | 'my-created') {
  acceptedTab.value = tab
  pagination.page = 1
  loadTickets()
}

const filters = reactive({
  status: 'OPEN' as TicketStatus | '',
  category: '' as TicketCategory | '',
  priority: '' as Priority | '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

async function loadTickets() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status || undefined,
      category: filters.category || undefined,
      priority: filters.priority || undefined,
      keyword: filters.keyword || undefined
    }

    let res
    if (mine.value) {
      // 显示我的工单
      res = await ticketApi.listTickets({
        ...params,
        creatorId: authStore.userInfo?.id
      })
    } else if (filters.status === 'OPEN') {
      // 待接单：排除自己创建的
      res = await ticketApi.listTickets({
        ...params,
        excludeCreatorId: authStore.userInfo?.id
      })
    } else if (filters.status === 'ACCEPTED') {
      // 处理中：根据 acceptedTab 过滤
      if (acceptedTab.value === 'my-accepted') {
        // 我接的单
        res = await ticketApi.listTickets({ ...params, handlerId: authStore.userInfo?.id })
      } else {
        // 我创建的被别人接的单
        res = await ticketApi.listTickets({
          ...params,
          creatorId: authStore.userInfo?.id,
          excludeHandlerId: authStore.userInfo?.id
        })
      }
    } else if (filters.status === 'COMPLETED') {
      // 已完成的
      res = await ticketApi.listTickets(params)
    } else {
      // 其他状态或全部：不排除自己
      res = await ticketApi.listTickets(params)
    }

    if (pagination.page === 1) {
      tickets.value = res.data
    } else {
      tickets.value = [...tickets.value, ...res.data]
    }
    pagination.total = res.total
  } finally {
    loading.value = false
    // 更新mine筛选时的计数
    if (mine.value && activeStatus.value && pagination.page === 1) {
      if (activeStatus.value === 'OPEN') mineStats.value.open = pagination.total
      else if (activeStatus.value === 'ACCEPTED') mineStats.value.accepted = pagination.total
      else if (activeStatus.value === 'PENDING_APPROVAL') mineStats.value.pendingApproval = pagination.total
      else if (activeStatus.value === 'COMPLETED') mineStats.value.completed = pagination.total
    }
  }
}

async function loadStats() {
  try {
    const userId = authStore.userInfo?.id
    stats.value = await ticketApi.getStats(userId)
  } catch {
    // ignore
  }
}

function handleStatusFilter(status: TicketStatus) {
  if (activeStatus.value === status) {
    activeStatus.value = ''
    filters.status = ''
  } else {
    activeStatus.value = status
    filters.status = status
  }
  pagination.page = 1
  loadTickets()
}

function toggleMine() {
  mine.value = !mine.value
  if (!mine.value) {
    mineStats.value = { open: 0, accepted: 0, pendingApproval: 0, completed: 0 }
  }
  pagination.page = 1
  loadTickets()
}

function loadMore() {
  loadingMore.value = true
  pagination.page++
  loadTickets().finally(() => {
    loadingMore.value = false
  })
}

function resetFilters() {
  filters.status = ''
  filters.category = ''
  filters.priority = ''
  filters.keyword = ''
  activeStatus.value = ''
  pagination.page = 1
  loadTickets()
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function getCategoryType(category: string) {
  const map: Record<string, string> = {
    BUG: 'danger',
    CONSULT: 'primary',
    COMPLAINT: 'warning',
    SUGGESTION: 'success',
    OTHER: 'info'
  }
  return map[category] || 'info'
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    BUG: 'Bug',
    CONSULT: '咨询',
    COMPLAINT: '投诉',
    SUGGESTION: '建议',
    OTHER: '其他'
  }
  return map[category] || category
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    OPEN: 'warning',
    ACCEPTED: 'primary',
    PENDING_APPROVAL: 'danger',
    COMPLETED: 'success',
    REJECTED: 'danger',
    CLOSED: 'info'
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    OPEN: '待接单',
    ACCEPTED: '处理中',
    PENDING_APPROVAL: '待审批',
    COMPLETED: '已完成',
    REJECTED: '已拒绝',
    CLOSED: '已关闭'
  }
  return map[status] || status
}

watch(() => ticketStore.refreshTrigger, () => {
  loadTickets()
  loadStats()
})

onMounted(() => {
  loadTickets()
  loadStats()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--glass-shadow-hover);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:active {
  transform: translateY(-1px);
}

.stat-card.active {
  border-color: var(--accent-primary) !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3), var(--glass-shadow);
}

.stat-card.active .stat-icon {
  transform: scale(1.1);
}

.stat-arrow {
  color: var(--text-tertiary);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-10px);
}

.stat-card:hover .stat-arrow,
.stat-card.active .stat-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent-primary);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform 0.3s ease;
}

.stat-icon-pending {
  background: linear-gradient(135deg, var(--accent-warning), #ffb347);
  box-shadow: 0 4px 16px rgba(255, 159, 10, 0.4);
}

.stat-icon-processing {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
}

.stat-icon-resolved {
  background: linear-gradient(135deg, var(--accent-success), #7dffb3);
  box-shadow: 0 4px 16px rgba(48, 209, 88, 0.4);
}

.stat-icon-pending-approval {
  background: linear-gradient(135deg, var(--accent-danger), #ff7875);
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.4);
}

.stat-icon-closed {
  background: linear-gradient(135deg, var(--text-tertiary), var(--text-secondary));
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* 工单卡片网格 */
.tickets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  min-height: 200px;
}

.ticket-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ticket-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--glass-shadow-hover);
}

.ticket-card:active {
  transform: translateY(-2px);
  transition-duration: 0.1s;
}

/* 自己的工单卡片样式 */
.ticket-card-mine {
  border: 1px solid rgba(48, 209, 88, 0.5) !important;
  box-shadow: 0 0 0 1px rgba(48, 209, 88, 0.2), var(--glass-shadow);
}

.ticket-card-mine::after {
  content: '我的';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #30d155, #7dffb3);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 12px;
  border-radius: 0 0 8px 8px;
}

.ticket-card {
  position: relative;
}

.ticket-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-id {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 500;
}

.ticket-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-card-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.ticket-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
  gap: 8px;
}

.ticket-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.priority-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.priority-badge.priority-P0 { background: rgba(255, 69, 58, 0.2); color: var(--accent-danger); }
.priority-badge.priority-P1 { background: rgba(255, 159, 10, 0.2); color: var(--accent-warning); }
.priority-badge.priority-P2 { background: rgba(100, 210, 255, 0.2); color: var(--accent-info); }
.priority-badge.priority-P3 { background: rgba(255, 255, 255, 0.1); color: var(--text-tertiary); }

.repo-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--accent-info);
  background: rgba(100, 210, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.price-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-success);
  background: rgba(48, 209, 88, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.ticket-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
  gap: 16px;
}

.empty-state p {
  font-size: 16px;
}

/* 加载更多 */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more-btn {
  min-width: 200px;
}

.no-more {
  color: var(--text-tertiary);
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 0;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-form :deep(.el-input__wrapper) {
  height: 34px;
  padding: 0 12px;
}

.filter-form :deep(.el-input__inner) {
  height: 34px;
  line-height: 34px;
}

.filter-form :deep(.glass-btn) {
  height: 34px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
}


.table-card {
  margin-bottom: 20px;
}

.ticket-title {
  color: var(--accent-info);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.ticket-title:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.text-tertiary {
  color: var(--text-tertiary);
}

.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.glass-btn:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
}

.glass-btn-active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.glass-btn-active:hover {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
  border-color: var(--accent-primary);
  color: #fff;
}

/* 处理中子Tab */
.accepted-sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sub-tab {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.sub-tab:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  color: var(--text-primary);
}

.sub-tab.active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}
</style>
