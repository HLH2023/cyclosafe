import App from './App';
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';

// 全局组件
import MIcon from '@/components/m-icon/m-icon.vue';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);

  // 注册全局组件
  app.component('m-icon', MIcon);

  return {
    app,
    pinia
  };
}
