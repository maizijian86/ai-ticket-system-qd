<template>
  <div class="ticket-detail">
    <div class="page-header">
      <el-button text @click="router.push('/tickets')" class="btn-glass">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <div v-loading="loading">
      <template v-if="ticket">
        <!-- 工单头部 -->
        <el-card class="ticket-header-card glass-card">
          <div class="ticket-header">
            <div class="ticket-title-row">
              <span class="ticket-id">#{{ ticket.id }}</span>
              <h1>{{ ticket.title }}</h1>
            </div>
            <div class="ticket-tags">
              <el-tag v-if="ticket.category" :type="getCategoryType(ticket.category)" size="small" class="glass-tag">
                {{ getCategoryLabel(ticket.category) }}
              </el-tag>
              <el-tag v-if="ticket.priority" size="small" :type="getPriorityType(ticket.priority)" class="glass-tag">
                {{ ticket.priority }}
              </el-tag>
              <el-tag :type="getStatusType(ticket.status)" size="small" class="glass-tag">
                {{ getStatusLabel(ticket.status) }}
              </el-tag>
              <el-tag v-if="ticket.urgency" size="small" :type="getUrgencyType(ticket.urgency)">
                {{ getUrgencyLabel(ticket.urgency) }}
              </el-tag>
            </div>
          </div>

          <div class="ticket-meta">
            <div class="meta-item">
              <span class="label">创建人</span>
              <span>{{ ticket.creatorName }}</span>
            </div>
            <div class="meta-item">
              <span class="label">处理人</span>
              <span>{{ ticket.handlerName || '待分配' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">创建时间</span>
              <span>{{ formatDate(ticket.createdAt) }}</span>
            </div>
            <div class="meta-item" v-if="ticket.acceptedAt">
              <span class="label">接单时间</span>
              <span>{{ formatDate(ticket.acceptedAt) }}</span>
            </div>
            <div class="meta-item" v-if="ticket.completedAt">
              <span class="label">完成时间</span>
              <span>{{ formatDate(ticket.completedAt) }}</span>
            </div>
          </div>

          <!-- 价格信息 -->
          <div v-if="ticket.price" class="price-info glass-card-static">
            <div class="price-item">
              <span class="label">工单价格</span>
              <span class="price-value">¥{{ ticket.price.toFixed(2) }}</span>
            </div>
            <div v-if="ticket.aiPriceSuggestion" class="price-item">
              <span class="label">AI推荐价</span>
              <span class="price-value ai-price">¥{{ ticket.aiPriceSuggestion.toFixed(2) }}</span>
            </div>
          </div>

          <!-- AI 摘要 -->
          <div v-if="ticket.aiSummary" class="ai-summary glass-card-static">
            <div class="ai-summary-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>AI 摘要</span>
            </div>
            <div class="ai-summary-content">{{ ticket.aiSummary }}</div>
          </div>

          <!-- 拒绝理由 -->
          <div v-if="ticket.status === 'REJECTED' && ticket.rejectionReason" class="rejection-reason glass-card-static">
            <div class="rejection-header">
              <el-icon><CircleClose /></el-icon>
              <span>拒绝理由</span>
            </div>
            <div class="rejection-content">{{ ticket.rejectionReason }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="ticket-actions">
            <el-button @click="router.push(`/tickets/${ticket.id}/edit`)" class="btn-glass" v-if="ticket.creatorId === authStore.userInfo?.id && ticket.status === 'OPEN'">
              编辑
            </el-button>
            <!-- Handler接单按钮 -->
            <el-button
              v-if="ticket.status === 'OPEN' && authStore.isHandler"
              type="primary"
              @click="handleAccept"
              class="btn-glass btn-glass-primary"
            >
              接单
            </el-button>
            <!-- Handler完成按钮 -->
            <el-button
              v-if="ticket.status === 'ACCEPTED' && ticket.handlerId === authStore.userInfo?.id"
              type="success"
              @click="showCompleteDialog = true"
              class="btn-glass btn-glass-success"
            >
              完成
            </el-button>
            <el-button v-if="ticket.status !== 'CLOSED' && ticket.status !== 'COMPLETED'" @click="handleClose" class="btn-glass">
              关闭工单
            </el-button>
          </div>
        </el-card>

        <!-- 工单内容 -->
        <el-card class="ticket-content-card glass-card">
          <div class="ticket-content">
            <h3>问题描述</h3>
            <div class="content-text">{{ ticket.content }}</div>
          </div>
        </el-card>

        <!-- GitHub 仓库 -->
        <el-card v-if="ticket.githubRepos?.length" class="github-repos-card glass-card">
          <template #header>
            <div class="github-repos-header">
              <span>GitHub 仓库</span>
              <span class="repo-count">{{ ticket.githubRepos.length }} 个</span>
            </div>
          </template>
          <div class="github-repos-list">
            <div v-for="(repo, index) in ticket.githubRepos" :key="index" class="repo-item">
              <el-icon><Folder /></el-icon>
              <span class="repo-name">{{ repo.name }}</span>
              <a :href="repo.url" target="_blank" class="repo-url">{{ repo.url }}</a>
            </div>
          </div>
        </el-card>

        <!-- 完成凭证 -->
        <el-card v-if="ticket.completionProof" class="completion-proof-card glass-card">
          <template #header>
            <div class="completion-header">
              <span>完成凭证</span>
            </div>
          </template>
          <div class="completion-content">{{ ticket.completionProof }}</div>
        </el-card>

        <!-- 用户审批区域 -->
        <el-card v-if="ticket.status === 'PENDING_APPROVAL' && ticket.creatorId === authStore.userInfo?.id" class="approval-card glass-card">
          <template #header>
            <div class="approval-header">
              <span>审批完成</span>
            </div>
          </template>
          <div class="approval-content">
            <p class="approval-tip">请审核Handler提交的工作成果，决定是否通过</p>
            <div class="approval-actions">
              <el-button type="success" @click="handleApprove(true)" class="btn-glass btn-glass-success">通过</el-button>
              <el-button type="danger" @click="showRejectDialog = true" class="btn-glass">拒绝</el-button>
            </div>
          </div>
        </el-card>

        <!-- 私聊区域 -->
        <el-card v-if="ticket.status === 'ACCEPTED'" class="chat-card glass-card">
          <template #header>
            <div class="chat-header">
              <span>在线沟通</span>
              <span class="chat-tip">与处理人实时沟通</span>
            </div>
          </template>
          <div class="chat-messages" ref="chatContainer">
            <div v-if="chatMessages.length === 0" class="empty-chat">
              暂无消息，开始对话吧
            </div>
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              :class="['chat-message', { 'is-self': msg.userId === authStore.userInfo?.id }]"
            >
              <div class="chat-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="chat-bubble">
                <div class="chat-meta">
                  <span class="chat-author">{{ msg.userName }}</span>
                  <el-tag size="small" type="info">用户</el-tag>
                  <span class="chat-time">{{ formatDate(msg.createdAt) }}</span>
                </div>
                <div class="chat-text">{{ msg.content }}</div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <el-input
              v-model="newChatMessage"
              placeholder="输入消息..."
              @keyup.enter="handleSendChat"
              class="glass-input"
            />
            <el-button type="primary" @click="handleSendChat" class="btn-glass btn-glass-primary">发送</el-button>
          </div>
        </el-card>

        <!-- 对话记录 -->
        <el-card class="comments-card glass-card">
          <template #header>
            <div class="comments-header">
              <span>对话记录</span>
              <span class="comment-count">{{ comments.length }} 条</span>
            </div>
          </template>

          <div class="comments-list">
            <div
              v-for="comment in comments"
              :key="comment.id"
              :class="['comment-item', { 'is-ai': comment.isAiSuggested, 'is-internal': comment.isInternal }]"
            >
              <div class="comment-avatar">
                <el-icon v-if="comment.isAiSuggested"><Star /></el-icon>
                <el-icon v-else><User /></el-icon>
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-author">{{ comment.userName }}</span>
                  <el-tag v-if="comment.isAiSuggested" size="small" type="warning" class="glass-tag">AI 建议</el-tag>
                  <el-tag v-if="comment.isInternal" size="small" class="glass-tag">内部</el-tag>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div v-if="comment.references?.length" class="comment-references glass-card-static">
                  <div class="references-title">参考来源</div>
                  <div v-for="ref in comment.references" :key="ref.source" class="reference-item">
                    {{ ref.source }} (相似度 {{ (ref.similarity * 100).toFixed(0) }}%)
                  </div>
                </div>
              </div>
            </div>

            <div v-if="comments.length === 0" class="empty-comments">
              暂无对话记录
            </div>
          </div>

          <!-- 回复输入 -->
          <div class="comment-input glass-card-static">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="输入回复内容..."
              @keydown.enter.ctrl="handleAddComment"
              class="glass-input"
            />
            <div class="comment-input-actions">
              <el-checkbox v-model="isInternal" class="glass-checkbox">内部留言</el-checkbox>
              <el-button type="primary" :loading="submitting" @click="handleAddComment" class="btn-glass btn-glass-primary">
                发送
              </el-button>
            </div>
          </div>
        </el-card>
      </template>
    </div>

    <!-- 完成工单弹窗 -->
    <el-dialog v-model="showCompleteDialog" title="完成工单" width="500px" class="clear-dialog">
      <el-form :model="completeForm" label-width="100px" class="glass-form-item">
        <el-form-item label="完成凭证" class="glass-input">
          <el-input
            v-model="completeForm.completionProof"
            type="textarea"
            :rows="4"
            placeholder="请填写完成凭证（GitHub链接、工作说明等）"
          />
        </el-form-item>
        <el-form-item label="GitHub仓库" class="glass-input">
          <div class="github-repos-list">
            <div v-for="(repo, index) in completeForm.githubRepos" :key="index" class="repo-item">
              <el-input v-model="repo.name" placeholder="仓库名称" style="width: 150px" />
              <el-input v-model="repo.url" placeholder="https://github.com/xxx/yyy" style="flex: 1" />
              <el-button type="danger" :icon="Delete" circle @click="removeCompleteRepo(index)" />
            </div>
            <el-button type="default" :icon="Plus" @click="addCompleteRepo" class="btn-glass">添加仓库</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false" class="btn-glass">取消</el-button>
        <el-button type="primary" :loading="completeLoading" @click="handleComplete" class="btn-glass btn-glass-primary">提交</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝工单弹窗 -->
    <el-dialog v-model="showRejectDialog" title="拒绝工单" width="500px" class="clear-dialog">
      <el-form class="glass-form-item">
        <el-form-item label="拒绝理由" class="glass-input">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请填写拒绝理由"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false" class="btn-glass">取消</el-button>
        <el-button type="danger" :loading="approveLoading" @click="handleApprove(false)" class="btn-glass">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ticketApi } from '@/api'
import { useTicketStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ChatDotRound, User, Star, Folder, CircleClose, Plus, Delete } from '@element-plus/icons-vue'
import type { TicketDTO, CommentDTO, GithubRepo, ChatMessage } from '@/types'

const router = useRouter()
const route = useRoute()
const ticketStore = useTicketStore()
const authStore = useAuthStore()

const ticket = ref<TicketDTO>()
const comments = ref<CommentDTO[]>([])
const newComment = ref('')
const isInternal = ref(false)
const loading = ref(false)
const submitting = ref(false)

// Chat related
const chatMessages = ref<ChatMessage[]>([])
const newChatMessage = ref('')
const chatContainer = ref<HTMLElement>()

// Complete dialog
const showCompleteDialog = ref(false)
const completeLoading = ref(false)
const completeForm = reactive({
  completionProof: '',
  githubRepos: [] as GithubRepo[]
})

// Reject dialog
const showRejectDialog = ref(false)
const rejectReason = ref('')
const approveLoading = ref(false)

function addCompleteRepo() {
  completeForm.githubRepos.push({ name: '', url: '' })
}

function removeCompleteRepo(index: number) {
  completeForm.githubRepos.splice(index, 1)
}

async function loadTicket() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    ticket.value = await ticketApi.getTicket(id)
    comments.value = ticket.value.comments || []
    // Load chat messages if ticket is ACCEPTED
    if (ticket.value.status === 'ACCEPTED') {
      await loadChatMessages()
    }
  } finally {
    loading.value = false
  }
}

async function loadChatMessages() {
  if (!ticket.value) return
  try {
    chatMessages.value = await ticketApi.getChatMessages(ticket.value.id)
    await nextTick()
    scrollChatToBottom()
  } catch {
    // ignore
  }
}

function scrollChatToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function handleAccept() {
  if (!ticket.value) return
  try {
    ticket.value = await ticketApi.acceptTicket(ticket.value.id)
    ticketStore.triggerRefresh()
    ElMessage.success('已接单')
  } catch {
    // error handled
  }
}

async function handleComplete() {
  if (!ticket.value || !completeForm.completionProof.trim()) {
    ElMessage.warning('请填写完成凭证')
    return
  }
  completeLoading.value = true
  try {
    ticket.value = await ticketApi.completeTicket(ticket.value.id, {
      completionProof: completeForm.completionProof.trim(),
      githubRepos: completeForm.githubRepos.length > 0 ? completeForm.githubRepos : undefined
    })
    ticketStore.triggerRefresh()
    showCompleteDialog.value = false
    ElMessage.success('已提交完成，等待用户审批')
  } catch {
    // error handled
  } finally {
    completeLoading.value = false
  }
}

async function handleApprove(approved: boolean) {
  if (!ticket.value) return
  if (!approved && !rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝理由')
    return
  }
  approveLoading.value = true
  try {
    ticket.value = await ticketApi.approveTicket(ticket.value.id, {
      approved,
      reason: approved ? undefined : rejectReason.value.trim()
    })
    ticketStore.triggerRefresh()
    showRejectDialog.value = false
    rejectReason.value = ''
    ElMessage.success(approved ? '已通过审批' : '已拒绝')
    // Clear chat when completed
    if (approved) {
      chatMessages.value = []
    }
  } catch {
    // error handled
  } finally {
    approveLoading.value = false
  }
}

async function handleSendChat() {
  if (!ticket.value || !newChatMessage.value.trim()) return
  try {
    const msg = await ticketApi.sendChatMessage(ticket.value.id, {
      content: newChatMessage.value.trim()
    })
    chatMessages.value.push(msg)
    newChatMessage.value = ''
    await nextTick()
    scrollChatToBottom()
  } catch {
    // error handled
  }
}

async function handleClose() {
  if (!ticket.value) return
  try {
    await ElMessageBox.confirm('确定要关闭此工单吗？', '确认关闭')
    ticket.value = await ticketApi.close(ticket.value.id)
    ticketStore.triggerRefresh()
    ElMessage.success('工单已关闭')
    chatMessages.value = []
  } catch {
    // cancelled
  }
}

async function handleAddComment() {
  if (!ticket.value || !newComment.value.trim()) return
  submitting.value = true
  try {
    const comment = await ticketApi.addComment(ticket.value.id, {
      content: newComment.value.trim(),
      isInternal: isInternal.value
    })
    comments.value.push(comment)
    newComment.value = ''
    ticketStore.triggerRefresh()
  } finally {
    submitting.value = false
  }
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

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    P0: 'danger',
    P1: 'warning',
    P2: 'primary',
    P3: 'info'
  }
  return map[priority] || 'info'
}

function getUrgencyType(urgency: string) {
  const map: Record<string, string> = {
    LOW: 'info',
    NORMAL: 'primary',
    HIGH: 'warning',
    CRITICAL: 'danger'
  }
  return map[urgency] || 'info'
}

function getUrgencyLabel(urgency: string) {
  const map: Record<string, string> = {
    LOW: '低',
    NORMAL: '普通',
    HIGH: '紧急',
    CRITICAL: '非常紧急'
  }
  return map[urgency] || urgency
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

// Watch for ticket status changes to clear chat
watch(() => ticket.value?.status, (newStatus) => {
  if (newStatus === 'COMPLETED' || newStatus === 'CLOSED' || newStatus === 'REJECTED') {
    chatMessages.value = []
  }
})

onMounted(() => {
  loadTicket()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.ticket-header-card {
  margin-bottom: 20px;
}

.ticket-header {
  margin-bottom: 20px;
}

.ticket-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.ticket-id {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.ticket-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.ticket-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ticket-meta {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 20px 0;
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item .label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-item span:last-child {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

/* Price info */
.price-info {
  display: flex;
  gap: 32px;
  margin-top: 20px;
  padding: 16px;
  border-radius: var(--radius-md) !important;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-item .label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-success);
}

.price-value.ai-price {
  color: var(--accent-info);
  font-size: 16px;
}

/* AI summary */
.ai-summary {
  margin-top: 20px;
  padding: 16px;
  border-radius: var(--radius-md) !important;
}

.ai-summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--accent-info);
}

.ai-summary-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* Rejection reason */
.rejection-reason {
  margin-top: 20px;
  padding: 16px;
  border-radius: var(--radius-md) !important;
  border: 1px solid rgba(255, 77, 79, 0.3);
}

.rejection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--accent-danger);
}

.rejection-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.ticket-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.ticket-content-card {
  margin-bottom: 20px;
}

.github-repos-card {
  margin-bottom: 20px;
}

.github-repos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.repo-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.github-repos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
}

.repo-item .el-icon {
  color: var(--accent-info);
  flex-shrink: 0;
}

.repo-name {
  font-weight: 500;
  color: var(--text-primary);
  flex-shrink: 0;
}

.repo-url {
  color: var(--accent-info);
  text-decoration: none;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-url:hover {
  text-decoration: underline;
}

.ticket-content h3 {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.content-text {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--text-secondary);
}

/* Completion proof */
.completion-proof-card {
  margin-bottom: 20px;
}

.completion-header {
  font-weight: 600;
}

.completion-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  white-space: pre-wrap;
}

/* Approval card */
.approval-card {
  margin-bottom: 20px;
  border: 1px solid rgba(255, 159, 10, 0.3);
}

.approval-header {
  font-weight: 600;
  color: var(--accent-warning);
}

.approval-content {
  padding: 16px 0;
}

.approval-tip {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.approval-actions {
  display: flex;
  gap: 12px;
}

/* Chat */
.chat-card {
  margin-bottom: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-tip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.chat-messages {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.empty-chat {
  text-align: center;
  padding: 32px;
  color: var(--text-tertiary);
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.chat-message.is-self {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.chat-message.is-self .chat-avatar {
  background: linear-gradient(135deg, var(--accent-success), var(--accent-info));
}

.chat-bubble {
  max-width: 70%;
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.chat-message.is-self .chat-meta {
  flex-direction: row-reverse;
}

.chat-author {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.chat-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.chat-text {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.chat-message.is-self .chat-text {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #fff;
}

.chat-input {
  display: flex;
  gap: 12px;
}

.chat-input .el-input {
  flex: 1;
}

/* Comments */
.comments-card {
  margin-bottom: 20px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comments-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.comment-item {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.comment-item.is-ai .comment-avatar {
  background: linear-gradient(135deg, var(--accent-warning), var(--accent-danger));
}

.comment-item.is-internal {
  opacity: 0.7;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comment-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.comment-references {
  margin-top: 12px;
  padding: 12px;
  border-radius: var(--radius-md) !important;
}

.references-title {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reference-item {
  font-size: 13px;
  color: var(--accent-info);
  margin-top: 6px;
}

.empty-comments {
  text-align: center;
  padding: 48px;
  color: var(--text-tertiary);
}

.comment-input {
  padding: 16px;
  border-radius: var(--radius-md) !important;
}

.comment-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.btn-glass-success {
  background: linear-gradient(135deg, var(--accent-success), #7dffb3) !important;
}
</style>
