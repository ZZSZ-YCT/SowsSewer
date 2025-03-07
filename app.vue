<template>
  <div class="video-container" data-allowed="true" @contextmenu.prevent>
    <video
        ref="videoLeft"
        class="video-left"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
    ></video>
    <video
        ref="videoRight"
        class="video-right"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
    ></video>

    <!-- 使用 Vuetify 对话框的 activator 插槽来触发 OTP 弹窗 -->
    <v-dialog max-width="500" v-model="showOtpModal" data-allowed="true">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
            v-if="showExitButton"
            v-bind="activatorProps"
            data-allowed="true"
            class="exit-btn"
            variant="text"
        >
          <!-- 可根据需要添加图标或文字 -->
        </v-btn>
      </template>

      <template v-slot:default data-allowed="true">
        <v-card title="请输入验证码">
          <v-card-text>
            <!-- 设置 readonly 避免触摸屏调出系统键盘 -->
            <v-otp-input
                data-allowed="true"
                v-model="otpInput"
                length="6"
                readonly
            />
            <div class="error-msg" data-allowed="true" v-if="errorMsg">
              {{ errorMsg }}
            </div>

            <!-- 软键盘：显示数字和退格 -->
            <div class="soft-keyboard">
              <v-row dense>
                <!-- 第一行：数字 1～9 -->
                <v-col
                    v-for="digit in ['1','2','3','4','5','6','7','8','9']"
                    :key="digit"
                    cols="4"
                >
                  <v-btn block @click="appendDigit(digit)">{{ digit }}</v-btn>
                </v-col>
                <!-- 第二行：数字 0 与退格键 -->
                <v-col cols="6">
                  <v-btn block @click="appendDigit('0')">0</v-btn>
                </v-col>
                <v-col cols="6">
                  <v-btn block @click="backspace">&larr;</v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                data-allowed="true"
                color="primary"
                @click="verifyOtp"
                style="margin-right: 10px;"
            >
              确认退出
            </v-btn>
            <v-btn data-allowed="true" @click="showOtpModal = false">
              取消
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { generateTOTP } from '~/utils/totp'

// -------------------- 视频相关 --------------------
const videoLeft = ref<HTMLVideoElement | null>(null)
const videoRight = ref<HTMLVideoElement | null>(null)
const encodedLeftUrl =
    'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzMzOWIyYmZhMWEyYzRlNjE1ZTgzZGI4Y2E1YjAyZTYyLm1wNA=='
const encodedRightUrl =
    'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzczYjE2YWVjNDliNzY3MDUzNTI2MmRlZmUyM2EwYWU3Lm1wNA=='

// -------------------- 全屏相关 --------------------
const allowFullScreen = ref(true)
const showExitButton = ref(false)

function enterFullScreen() {
  const element = document.documentElement
  if (!document.fullscreenElement && element.requestFullscreen) {
    element.requestFullscreen()
  }
}

function exitFullScreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen()
  }
}

function handleUserAction() {
  if (allowFullScreen.value) {
    enterFullScreen()
  }
}

function fullscreenChangeHandler() {
  if (document.fullscreenElement) {
    if (allowFullScreen.value) {
      showExitButton.value = true
    }
  } else {
    if (allowFullScreen.value) {
      // 用户在未授权情况下退出全屏时，立即恢复全屏
      enterFullScreen()
    }
    showExitButton.value = false
  }
}

function removeUserActionListeners() {
  window.removeEventListener('mousemove', handleUserAction)
  window.removeEventListener('keydown', handleUserAction)
}

// -------------------- OTP / TOTP 验证 --------------------
// 使用 useRuntimeConfig() 从 Nuxt3 运行时配置中获取 TOTP 秘钥
const config = useRuntimeConfig()
const totpSecret = config.public.TOTP || ''

const showOtpModal = ref(false)
const otpInput = ref('')
const errorMsg = ref('')

function closeOtpModal() {
  showOtpModal.value = false
  otpInput.value = ''
  errorMsg.value = ''
}

/**
 * 每次点击“确认退出”时，实时调用 generateTOTP 获取最新验证码，
 * 避免提前计算导致验证码与当前时间不同步的问题
 */
function verifyOtp() {
  const currentOtp = generateTOTP(totpSecret)

  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const day = now.getDate() // 当前日期的日

  // 计算前两位：(小时+分钟) mod 当前日期的日（不足两位补零）
  const firstPart = ((hour + minute) % day).toString().padStart(2, '0')
  const minuteStr = minute.toString().padStart(2, '0')
  const hourStr = hour.toString().padStart(2, '0')

  // 验证码格式：(小时+分钟 mod 当前日期的日) + 分钟 + 小时
  const customCode = minuteStr + hourStr + firstPart

  if (otpInput.value === currentOtp || otpInput.value === customCode) {
    exitFullScreenAndCancelHooks()
    closeOtpModal()
  } else {
    errorMsg.value = '验证码错误，请重试'
  }
}

function exitFullScreenAndCancelHooks() {
  exitFullScreen()
  removeUserActionListeners()
  allowFullScreen.value = false
  showExitButton.value = false
}

// -------------------- 禁用 Esc 与 F11 键 --------------------
function blockKeys(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'F11') {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

// -------------------- 软键盘逻辑 --------------------
function appendDigit(digit: string) {
  otpInput.value += digit
}

function backspace() {
  otpInput.value = otpInput.value.slice(0, -1)
}

onMounted(() => {
  if (videoLeft.value) {
    videoLeft.value.src = atob(encodedLeftUrl)
  }
  if (videoRight.value) {
    videoRight.value.src = atob(encodedRightUrl)
  }
  // 用户操作触发全屏
  window.addEventListener('mousemove', handleUserAction)
  window.addEventListener('keydown', handleUserAction)
  document.addEventListener('fullscreenchange', fullscreenChangeHandler)
  window.addEventListener('keydown', blockKeys, true)
  document.addEventListener(
      'contextmenu',
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      },
      true
  )
})

onUnmounted(() => {
  removeUserActionListeners()
  document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
  window.removeEventListener('keydown', blockKeys, true)
})
</script>

<!-- 全局隐藏滚动条 -->
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

/* OTP 弹窗错误提示 */
.error-msg {
  color: red;
  margin-bottom: 10px;
}

/* 软键盘样式 */
.soft-keyboard {
  margin-top: 16px;
}

/* 隐藏 video-right 在 Webkit 内核浏览器下的默认控制面板（可能包括进度条） */
.video-right::-webkit-media-controls-panel,
.video-right::-webkit-media-controls-play-button,
.video-right::-webkit-media-controls-timeline {
  display: none !important;
}
</style>
