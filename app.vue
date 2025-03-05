<template>
  <div class="video-container" data-allowed="true" @contextmenu.prevent>
    <video ref="videoLeft" class="video-left" autoplay loop muted playsinline></video>
    <video ref="videoRight" class="video-right" autoplay loop muted playsinline></video>

    <!-- 右上角退出按钮：仅在全屏状态下显示 -->
    <v-btn
        v-if="showExitButton"
        data-allowed="true"
        class="exit-btn"
        icon="mdi-location-exit"
        @click="openOtpModal"
    >
      exit
    </v-btn>

    <!-- OTP 弹窗，背景灰化 -->
    <div v-if="showOtpModal" class="otp-overlay" data-allowed="true">
      <div class="otp-modal" data-allowed="true">
        <v-otp-input data-allowed="true" v-model="otpInput" length="6" />
        <div class="error-msg" data-allowed="true" v-if="errorMsg">{{ errorMsg }}</div>
        <v-btn data-allowed="true" color="primary" @click="verifyOtp">确认退出</v-btn>
        <v-btn data-allowed="true" text @click="closeOtpModal">取消</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { generateTOTP } from '~/utils/totp'

// -------------------- 视频相关 --------------------
const videoLeft = ref<HTMLVideoElement | null>(null)
const videoRight = ref<HTMLVideoElement | null>(null)
// Base64 编码的视频 URL（请根据实际情况替换）
const encodedLeftUrl =
    'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzMzOWIyYmZhMWEyYzRlNjE1ZTgzZGI4Y2E1YjAyZTYyLm1wNA=='
const encodedRightUrl =
    'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzczYjE2YWVjNDliNzY3MDUzNTI2MmRlZmUyM2EwYWU3Lm1wNA=='

// -------------------- 全屏相关 --------------------
const allowFullScreen = ref(true)
const showExitButton = ref(false)

/** 调用全屏 API */
function enterFullScreen() {
  const element = document.documentElement
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  }
}

/** 退出全屏 */
function exitFullScreen() {
  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

/** 用户操作触发全屏 */
function handleUserAction() {
  if (allowFullScreen.value) {
    enterFullScreen()
  }
}

/** 监听全屏变化事件，根据 document.fullscreenElement 来更新退出按钮显示 */
function fullscreenChangeHandler() {
  if (document.fullscreenElement) {
    if (allowFullScreen.value) {
      showExitButton.value = true
    }
  } else {
    showExitButton.value = false
  }
}

/** 取消用户操作事件监听 */
function removeUserActionListeners() {
  window.removeEventListener("mousemove", handleUserAction)
  window.removeEventListener("keydown", handleUserAction)
}

// -------------------- OTP / TOTP 验证 --------------------
const totpSecret = "5LCWUHDE6JI6C3B3TIZWBYRBW6627CLH"
const showOtpModal = ref(false)
const otpInput = ref("")
const errorMsg = ref("")

function openOtpModal() {
  showOtpModal.value = true
  otpInput.value = ""
  errorMsg.value = ""
}

function closeOtpModal() {
  showOtpModal.value = false
  otpInput.value = ""
  errorMsg.value = ""
}

/**
 * 每次点击“确认退出”时，实时调用 generateTOTP 获取最新验证码，
 * 避免提前计算导致验证码与当前时间不同步的问题
 */
function verifyOtp() {
  const currentOtp = generateTOTP(totpSecret)
  if (otpInput.value === currentOtp) {
    exitFullScreenAndCancelHooks()
    closeOtpModal()
  } else {
    errorMsg.value = "验证码错误，请重试"
  }
}

/** 验证通过后，退出全屏、取消事件监听并隐藏退出按钮 */
function exitFullScreenAndCancelHooks() {
  exitFullScreen()
  removeUserActionListeners()
  allowFullScreen.value = false
  showExitButton.value = false
}

// -------------------- 拦截 Esc 与 F11 --------------------
function blockKeys(e: KeyboardEvent) {
  if (e.key === "Escape" || e.key === "F11" || e.keyCode === 27 || e.keyCode === 122) {
    e.preventDefault()
    e.stopImmediatePropagation()
    return false
  }
}

// -------------------- 阻拦插件注入的 DIV 与 BUTTON --------------------
let observer: MutationObserver | null = null
let fallbackInterval: number | null = null

function startPreventInjectedNodes() {
  // 如果 MutationObserver 可用，则使用它
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            const tag = el.tagName.toLowerCase()
            // 如果是 div、button 或自定义按钮（v-btn）且没有 data-allowed 标记，则移除
            if ((tag === 'div' || tag === 'button' || tag === 'v-btn') && !el.hasAttribute('data-allowed')) {
              el.remove()
              console.warn('Blocked injected element:', el)
            }
          }
        })
      })
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  } else {
    // MutationObserver 不存在时，使用 setInterval 轮询查找并删除不允许的元素
    fallbackInterval = window.setInterval(() => {
      document.querySelectorAll('div:not([data-allowed]), button:not([data-allowed]), v-btn:not([data-allowed])')
          .forEach(el => {
            el.remove()
            console.warn('Blocked injected element (fallback):', el)
          })
    }, 1000)
  }
}

function stopPreventInjectedNodes() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (fallbackInterval !== null) {
    window.clearInterval(fallbackInterval)
    fallbackInterval = null
  }
}

onMounted(() => {
  // 设置视频 src
  if (videoLeft.value) {
    videoLeft.value.src = atob(encodedLeftUrl)
  }
  if (videoRight.value) {
    videoRight.value.src = atob(encodedRightUrl)
  }
  // 用户操作：触发全屏
  window.addEventListener("mousemove", handleUserAction)
  window.addEventListener("keydown", handleUserAction)
  document.addEventListener("fullscreenchange", fullscreenChangeHandler)
  // 阻拦 Esc 与 F11 键（捕获阶段拦截）
  window.addEventListener("keydown", blockKeys, true)
  // 全局阻止右键菜单
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, true)
  // 启动拦截不允许注入的元素
  startPreventInjectedNodes()
})

onUnmounted(() => {
  removeUserActionListeners()
  document.removeEventListener("fullscreenchange", fullscreenChangeHandler)
  window.removeEventListener("keydown", blockKeys, true)
  stopPreventInjectedNodes()
})
</script>

<!-- 隐藏滚动条（全局样式） -->
<style>
:global(html),
:global(body) {
  overflow: hidden;
}
</style>

<style scoped>
.video-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.video-left,
.video-right {
  width: 50%;
  height: 100%;
  object-fit: cover;
}

/* 右上角退出按钮 */
.exit-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

/* OTP 弹窗及灰色背景 */
.otp-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.otp-modal {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.error-msg {
  color: red;
  margin-bottom: 10px;
}
</style>
