import { defineNuxtConfig } from 'nuxt/config'
import { md3 } from 'vuetify/blueprints'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      TOTP: process.env.TOTP || ''
    }
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    'vuetify-nuxt-module'
  ],
  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      blueprint: md3,
      theme: {
        defaultTheme: 'insLight',
        themes: {
          insLight: {
            dark: false,
            colors: {
              primary: '#31b7f1', //
              secondary: '#E0E0E0', //
              accent: '#FFCDD2', // 浅粉色
              error: '#FF5252', // 错误颜色
              info: '#8ef11b', // 信息颜色
              success: '#4CAF50', // 成功颜色
              warning: '#FFC107' // 警告颜色
            }
          }
        }
      }
    }
  }
})
