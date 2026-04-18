<template>
  <div class="ticket-create">
    <div class="page-header">
      <el-button text @click="router.push('/tickets')" class="btn-glass">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>创建工单</h2>
    </div>

    <div class="create-form">
      <el-card class="form-card glass-card">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="glass-form-item">
          <el-form-item label="问题描述" prop="content" class="glass-input">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="6"
              placeholder="请详细描述您遇到的问题..."
              maxlength="2000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item class="ai-fill-item">
            <el-button
              :loading="aiFilling"
              @click="handleAiFill"
              :disabled="!form.content || form.content.length < 10"
              class="btn-glass ai-fill-btn"
            >
              <el-icon v-if="!aiFilling"><MagicStick /></el-icon>
              AI智能填充
            </el-button>
            <span class="ai-hint" v-if="!aiFilling && !hasAiFilled">输入问题描述后，点击按钮自动填充标题、分类和紧急程度</span>
            <span class="ai-hint success" v-if="hasAiFilled && !aiFilling">已填充，可自行修改</span>
          </el-form-item>

          <el-form-item label="标题" prop="title" class="glass-input">
            <el-input
              v-model="form.title"
              placeholder="请输入工单标题"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="GitHub仓库" class="glass-input">
            <div class="github-repos-list">
              <div v-for="(repo, index) in form.githubRepos" :key="index" class="repo-item">
                <el-input v-model="repo.name" placeholder="仓库名称" style="width: 200px" />
                <el-input v-model="repo.url" placeholder="https://github.com/xxx/yyy" style="flex: 1" />
                <el-button type="danger" :icon="Delete" circle @click="removeRepo(index)" />
              </div>
              <el-button type="default" :icon="Plus" @click="addRepo" class="btn-glass">添加仓库</el-button>
            </div>
          </el-form-item>

          <el-form-item label="分类" prop="category" class="glass-input">
            <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
              <el-option label="Bug - 程序错误" value="BUG" />
              <el-option label="咨询 - 使用咨询" value="CONSULT" />
              <el-option label="投诉 - 问题投诉" value="COMPLAINT" />
              <el-option label="建议 - 改进建议" value="SUGGESTION" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>

          <el-form-item label="紧急程度" class="glass-radio">
            <el-radio-group v-model="form.urgency">
              <el-radio label="LOW">低</el-radio>
              <el-radio label="NORMAL">普通</el-radio>
              <el-radio label="HIGH">紧急</el-radio>
              <el-radio label="CRITICAL">非常紧急</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="工单价格" class="glass-input">
            <div class="price-section">
              <div v-if="!form.price && !priceLoading" class="price-recommend">
                <el-button
                  :loading="priceLoading"
                  @click="handleRecommendPrice"
                  :disabled="!form.content || form.content.length < 10"
                  class="btn-glass"
                >
                  <el-icon v-if="!priceLoading"><Money /></el-icon>
                  AI推荐价格
                </el-button>
                <span class="ai-hint">填写问题描述后获取AI推荐价格</span>
              </div>
              <div v-if="priceLoading" class="price-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在获取AI推荐价格...</span>
              </div>
              <div v-if="aiPriceData && !priceLoading" class="price-suggestion glass-card-static">
                <div class="price-suggestion-header">
                  <span>AI推荐价格</span>
                  <span class="price-range">参考区间: {{ aiPriceData.priceRange }}</span>
                </div>
                <div class="price-value">
                  <span class="price-number">¥{{ aiPriceData.suggestedPrice.toFixed(2) }}</span>
                  <el-button size="small" @click="acceptSuggestedPrice" class="btn-glass">采纳</el-button>
                  <el-button size="small" @click="clearPriceSuggestion" class="btn-glass">取消</el-button>
                </div>
                <div class="price-reasoning">{{ aiPriceData.reasoning }}</div>
              </div>
              <div v-if="form.price !== undefined && form.price !== null && !priceLoading" class="price-input-row">
                <el-input-number v-model="form.price" :min="0" :precision="2" :step="10" />
                <span class="price-unit">元</span>
                <el-button v-if="aiPriceData" size="small" @click="clearPriceSuggestion" class="btn-glass">清除AI推荐</el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button @click="router.push('/tickets')" class="btn-glass">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" class="btn-glass btn-glass-primary">
            提交工单
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ticketApi, aiApi } from '@/api'
import { useTicketStore } from '@/stores'
import { ElMessage } from 'element-plus'
import { ArrowLeft, MagicStick, Plus, Delete, Money, Loading } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { TicketCategory, Urgency, GithubRepo, PriceRecommendResponse } from '@/types'

const router = useRouter()
const ticketStore = useTicketStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const aiFilling = ref(false)
const hasAiFilled = ref(false)
const priceLoading = ref(false)
const aiPriceData = ref<PriceRecommendResponse | null>(null)

const form = reactive({
  content: '',
  title: '',
  category: '' as TicketCategory | '',
  urgency: 'NORMAL' as Urgency,
  githubRepos: [] as GithubRepo[],
  price: undefined as number | undefined,
  aiPriceSuggestion: undefined as number | undefined
})

const rules = {
  content: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

function addRepo() {
  form.githubRepos.push({ name: '', url: '' })
}

function removeRepo(index: number) {
  form.githubRepos.splice(index, 1)
}

async function handleAiFill() {
  if (!form.content || form.content.length < 10) {
    ElMessage.warning('请先填写问题描述（至少10个字）')
    return
  }

  aiFilling.value = true
  hasAiFilled.value = false
  try {
    // 并行调用三个AI接口
    const [classifyRes, priorityRes, titleRes] = await Promise.all([
      aiApi.classify(form.content),
      aiApi.evaluatePriority(form.content, form.urgency),
      aiApi.generateTitle(form.content)
    ])

    // 填充分类
    if (classifyRes && classifyRes.category) {
      const validCategories: TicketCategory[] = ['BUG', 'CONSULT', 'COMPLAINT', 'SUGGESTION', 'OTHER']
      if (validCategories.includes(classifyRes.category as TicketCategory)) {
        form.category = classifyRes.category as TicketCategory
      }
    }

    // 填充紧急程度
    if (priorityRes && priorityRes.priority) {
      const validUrgencies: Urgency[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']
      if (validUrgencies.includes(priorityRes.priority as Urgency)) {
        form.urgency = priorityRes.priority as Urgency
      }
    }

    // 填充标题
    if (titleRes && titleRes.title) {
      form.title = titleRes.title
    }

    hasAiFilled.value = true
    ElMessage.success('已自动填充，可自行修改')
  } catch {
    ElMessage.error('AI填充失败，请手动填写')
  } finally {
    aiFilling.value = false
  }
}

async function handleRecommendPrice() {
  if (!form.content || form.content.length < 10) {
    ElMessage.warning('请先填写问题描述（至少10个字）')
    return
  }

  priceLoading.value = true
  aiPriceData.value = null
  try {
    const res = await aiApi.recommendPrice(
      form.content,
      form.category || undefined,
      undefined,
      form.urgency
    )
    aiPriceData.value = res
  } catch {
    ElMessage.error('获取AI推荐价格失败')
  } finally {
    priceLoading.value = false
  }
}

function acceptSuggestedPrice() {
  if (aiPriceData.value) {
    form.price = aiPriceData.value.suggestedPrice
    form.aiPriceSuggestion = aiPriceData.value.suggestedPrice
  }
}

function clearPriceSuggestion() {
  aiPriceData.value = null
  form.price = undefined
  form.aiPriceSuggestion = undefined
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const ticket = await ticketApi.createTicket({
          title: form.title,
          content: form.content,
          category: form.category as TicketCategory,
          urgency: form.urgency as Urgency,
          githubRepos: form.githubRepos.length > 0 ? form.githubRepos : undefined,
          price: form.price,
          aiPriceSuggestion: form.aiPriceSuggestion
        })

        ticketStore.triggerRefresh()
        ElMessage.success('工单创建成功')
        router.push(`/tickets/${ticket.id}`)
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.create-form {
  max-width: 800px;
}

.form-card {
  padding: 8px;
}

.ai-fill-item {
  margin-bottom: 20px;
}

.ai-fill-btn {
  margin-right: 16px;
}

.ai-hint {
  color: var(--text-secondary, #909399);
  font-size: 13px;
}

.ai-hint.success {
  color: var(--el-color-success, #67c23a);
}

.github-repos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.repo-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

/* Price section styles */
.price-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-recommend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.price-suggestion {
  padding: 16px;
  border-radius: var(--radius-md) !important;
}

.price-suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--accent-info);
}

.price-range {
  font-size: 12px;
  font-weight: normal;
  color: var(--text-secondary);
}

.price-value {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.price-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-success);
}

.price-unit {
  color: var(--text-secondary);
}

.price-reasoning {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.price-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-input-row .el-input-number {
  width: 150px;
}
</style>
