<template>
  <!-- 禁用整个容器的右键菜单 -->
  <div class="video-container" @contextmenu.prevent>
    <!-- 使用 ref 不直接在标签中写 src -->
    <video ref="videoLeft" class="video-left" autoplay loop muted playsinline></video>
    <video ref="videoRight" class="video-right" autoplay loop muted playsinline></video>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      // 这里存放的是 base64 编码后的 URL（你可以自行替换）
      encodedLeftUrl: 'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzMzOWIyYmZhMWEyYzRlNjE1ZTgzZGI4Y2E1YjAyZTYyLm1wNA==',
      encodedRightUrl: 'aHR0cHM6Ly9zdGF0aWMuc2hpdHRpbS5hcnQvdmlkZW9zLzczYjE2YWVjNDliNzY3MDUzNTI2MmRlZmUyM2EwYWU3Lm1wNA=='
    }
  },
  mounted() {
    // 尝试进入全屏
    this.enterFullScreen();

    // 动态将解码后的 URL 赋值给视频元素，避免直接在 HTML 源码中显示
    this.$refs.videoLeft.src = atob(this.encodedLeftUrl);
    this.$refs.videoRight.src = atob(this.encodedRightUrl);
  },
  beforeDestroy() {
    document.onkeydown = null;
  },
  methods: {
    enterFullScreen() {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
      }
    }
  }
}
</script>

<style scoped>
.video-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.video-left,
.video-right {
  width: 50%;
  height: 100%;
  object-fit: cover; /* 确保视频铺满整个区域 */
}
</style>
