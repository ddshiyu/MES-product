import {
  createSSRApp
} from "vue";
import { createPinia } from 'pinia'
import type { App as VueApp } from 'vue'

import App from "./App.vue";

export function createApp() {
  const app: VueApp = createSSRApp(App);
  app.use(createPinia())

  return {
    app,
  };
} 
