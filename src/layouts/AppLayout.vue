<template>
  <el-container class="app-layout">
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header class="header glass-card-static">
        <div class="header-left">
          <div class="logo-icon">
            <el-icon size="22"><Ticket /></el-icon>
          </div>
          <span class="logo-text">AI 工单</span>
        </div>
        <div class="header-right">
          <!-- 未登录显示登录按钮 -->
          <el-button v-if="!authStore.token" @click="showLoginModal = true" class="btn-glass btn-glass-primary">
            登录
          </el-button>
          <!-- 已登录显示用户信息 -->
          <el-dropdown v-else @command="handleCommand" trigger="click" class="glass-dropdown">
            <span class="user-info">
              <div class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </div>
              <span class="user-name">{{ authStore.userInfo?.nickname || authStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 登录/注册弹窗 -->
      <Transition name="modal-fade">
        <div v-if="showLoginModal" class="login-overlay" @click.self="closeModal">
          <div class="login-modal glass-card">
            <div class="login-header">
              <h3>{{ isRegisterMode ? '注册账号' : '登录 AI 工单' }}</h3>
              <el-icon class="close-btn" @click="closeModal"><Close /></el-icon>
            </div>

            <!-- 登录表单 -->
            <el-form v-if="!isRegisterMode" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码"
                  size="large"
                  :prefix-icon="Lock"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loginLoading" @click="handleLogin" class="login-btn">
                  登录
                </el-button>
              </el-form-item>
              <div class="login-footer">
                <span>还没有账号？</span>
                <el-button link type="primary" @click="isRegisterMode = true">立即注册</el-button>
              </div>
            </el-form>

            <!-- 注册表单 -->
            <el-form v-else ref="registerFormRef" :model="registerForm" :rules="registerRules" class="login-form">
              <el-form-item prop="username">
                <el-input v-model="registerForm.username" placeholder="用户名" size="large" :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="nickname">
                <el-input v-model="registerForm.nickname" placeholder="昵称" size="large" :prefix-icon="UserFilled" />
              </el-form-item>
              <el-form-item label="用户类型" class="glass-radio">
                <el-radio-group v-model="registerForm.role" class="role-radio-group">
                  <el-radio label="USER">普通用户</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="密码" size="large" :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item>
                <el-input v-model="registerForm.githubUsername" placeholder="GitHub用户名（可选）" size="large" :prefix-icon="Link" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="registerLoading" @click="handleRegister" class="login-btn">
                  注册
                </el-button>
              </el-form-item>
              <div class="login-footer">
                <span>已有账号？</span>
                <el-button link type="primary" @click="isRegisterMode = false">立即登录</el-button>
              </div>
            </el-form>
          </div>
        </div>
      </Transition>

      <!-- 个人资料弹窗 -->
      <el-dialog v-model="showProfileDialog" title="个人资料" width="500px" class="profile-dialog">
        <el-form ref="profileFormRef" :model="profileForm" label-width="100px" class="glass-form-item profile-form">
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="GitHub用户名">
            <el-input v-model="profileForm.githubUsername" placeholder="请输入GitHub用户名" />
          </el-form-item>
          <el-form-item label="GitHub仓库">
            <div class="github-repos-list">
              <div v-for="(repo, index) in profileForm.githubRepos" :key="index" class="repo-item">
                <el-input v-model="repo.name" placeholder="仓库名称" style="width: 150px" />
                <el-input v-model="repo.url" placeholder="https://github.com/xxx/yyy" style="flex: 1" />
                <el-button type="danger" :icon="Delete" circle @click="removeProfileRepo(index)" />
              </div>
              <el-button type="default" :icon="Plus" @click="addProfileRepo" class="btn-glass">添加仓库</el-button>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showProfileDialog = false" class="btn-glass">取消</el-button>
          <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile" class="btn-glass btn-glass-primary">
            保存
          </el-button>
        </template>
      </el-dialog>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view :key="route.fullPath" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { GithubRepo } from '@/types'
import {
  Ticket, User, UserFilled, ArrowDown, Lock, Close, Plus, Delete, Link
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const ticketStore = useTicketStore()

const showLoginModal = ref(false)
const isRegisterMode = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const showProfileDialog = ref(false)
const profileLoading = ref(false)
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
  githubUsername: '',
  githubRepos: [] as GithubRepo[]
})

// 监听来自其他组件的登录弹窗触发
watch(() => ticketStore.showAuthModal, (val) => {
  if (val) {
    showLoginModal.value = true
    isRegisterMode.value = ticketStore.authModalMode === 'register'
    ticketStore.showAuthModal = false
  }
})

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'USER',
  githubUsername: '',
  githubRepos: [] as GithubRepo[]
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

function handleCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
  } else if (command === 'profile') {
    openProfileDialog()
  }
}

function closeModal() {
  showLoginModal.value = false
  isRegisterMode.value = false
  loginForm.username = ''
  loginForm.password = ''
  registerForm.username = ''
  registerForm.nickname = ''
  registerForm.password = ''
  registerForm.role = 'USER'
  registerForm.githubUsername = ''
  registerForm.githubRepos = []
}

async function handleLogin() {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loginLoading.value = true
      try {
        await authStore.login(loginForm.username, loginForm.password)
        const pendingPath = ticketStore.pendingPath
        closeModal()
        ElMessage.success('登录成功')
        if (pendingPath) {
          ticketStore.pendingPath = null
          router.push(pendingPath)
        }
      } catch {
        ElMessage.error('用户名或密码错误')
      } finally {
        loginLoading.value = false
      }
    }
  })
}

async function handleRegister() {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        await authStore.register({
          username: registerForm.username,
          nickname: registerForm.nickname,
          password: registerForm.password,
          role: registerForm.role,
          githubUsername: registerForm.githubUsername || undefined,
          githubRepos: registerForm.githubRepos.length > 0 ? registerForm.githubRepos : undefined
        })
        ElMessage.success('注册成功，请登录')
        isRegisterMode.value = false
      } catch {
        ElMessage.error('注册失败，请重试')
      } finally {
        registerLoading.value = false
      }
    }
  })
}

function openProfileDialog() {
  if (!authStore.userInfo) return
  profileForm.username = authStore.userInfo.username
  profileForm.nickname = authStore.userInfo.nickname || ''
  profileForm.email = authStore.userInfo.email || ''
  profileForm.githubUsername = authStore.userInfo.githubUsername || ''
  profileForm.githubRepos = authStore.userInfo.githubRepos ? [...authStore.userInfo.githubRepos] : []
  showProfileDialog.value = true
}

function addProfileRepo() {
  profileForm.githubRepos.push({ name: '', url: '' })
}

function removeProfileRepo(index: number) {
  profileForm.githubRepos.splice(index, 1)
}

async function handleUpdateProfile() {
  if (!authStore.userInfo) return
  profileLoading.value = true
  try {
    const updated = await userApi.updateUser(authStore.userInfo.id, {
      nickname: profileForm.nickname,
      email: profileForm.email,
      githubUsername: profileForm.githubUsername || undefined,
      githubRepos: profileForm.githubRepos.length > 0 ? profileForm.githubRepos : []
    })
    authStore.userInfo = { ...authStore.userInfo, ...updated }
    localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo))
    showProfileDialog.value = false
    ElMessage.success('资料已更新')
  } catch {
    ElMessage.error('更新失败')
  } finally {
    profileLoading.value = false
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
}

/* ========================================
   侧边栏
   ======================================== */
.sidebar {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(var(--blur-medium));
  -webkit-backdrop-filter: blur(var(--blur-medium));
  border-right: 1px solid var(--glass-border);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  margin: 16px;
  border-radius: var(--radius-lg) !important;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-menu {
  flex: 1;
  background: transparent;
  border-right: none;
  padding: 8px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: var(--radius-md);
  margin-bottom: 4px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(94, 92, 230, 0.3));
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  border-radius: var(--radius-md);
  margin-bottom: 4px;
  color: var(--text-secondary);
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

/* ========================================
   顶部栏
   ======================================== */
.header {
  height: 72px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px !important;
  margin: 16px;
  margin-bottom: 0;
  border-radius: var(--radius-lg) !important;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: var(--glass-bg-hover);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* ========================================
   主内容区
   ======================================== */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content {
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 88px);
}

/* ========================================
   登录弹窗样式 - 自定义玻璃态弹窗
   ======================================== */
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.login-modal {
  width: 400px;
  padding: 24px;
  animation: modal-enter 0.3s ease;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.login-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  font-size: 20px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.login-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 122, 255, 0.5);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.login-form :deep(.el-input__inner) {
  color: var(--text-primary);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--text-tertiary);
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
  border: none;
  border-radius: var(--radius-md);
  margin-top: 8px;
  color: #fff;
}

.login-btn:hover {
  background: linear-gradient(135deg, var(--accent-primary), #5eb8ff);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .login-modal,
.modal-fade-leave-active .login-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .login-modal,
.modal-fade-leave-to .login-modal {
  transform: scale(0.9);
}

.github-repos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.repo-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes modal-enter {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 个人资料弹窗玻璃态表单样式 - 高对比度版本 */
.profile-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: none !important;
  border-radius: var(--radius-md);
  padding: 12px 16px;
}

.profile-form :deep(.el-input__wrapper:hover),
.profile-form :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(0, 122, 255, 0.7) !important;
  background: rgba(255, 255, 255, 0.25) !important;
}

.profile-form :deep(.el-input__inner) {
  color: #ffffff !important;
}

.profile-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.profile-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.profile-form :deep(.el-input.is-disabled .el-input__inner) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* 个人资料弹窗 - 使用和登录卡片一样的液态玻璃样式 */
.profile-dialog {
  border-radius: var(--radius-lg);
}

.profile-dialog :deep(.el-dialog) {
  background: rgba(40, 40, 60, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.profile-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 24px;
}

.profile-dialog :deep(.el-dialog__title) {
  color: #ffffff !important;
  font-weight: 600;
  font-size: 18px;
}

.profile-dialog :deep(.el-dialog__body) {
  color: #ffffff;
  padding: 24px;
}

.profile-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 24px;
}

.profile-dialog :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.85) !important;
  font-weight: 500;
}

.profile-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid var(--glass-border);
  padding: 16px 24px;
}

.profile-dialog :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-weight: 500;
}

/* 用户类型单选按钮样式 */
.role-radio-group {
  display: flex;
  gap: 20px;
}

.role-radio-group :deep(.el-radio__label) {
  color: var(--text-secondary) !important;
}

.role-radio-group :deep(.el-radio__input.is-checked .el-radio__label) {
  color: var(--text-primary) !important;
}
</style>
