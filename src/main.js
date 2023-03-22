import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import { createPinia } from 'pinia'

const app = createApp(App).use(createPinia())

app.mount('#app')
