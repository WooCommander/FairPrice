import { createApp } from 'vue'
import './styles/main.scss'
import App from './App.vue'
import router from './router'


import { authStore } from '@/modules/auth/store/authStore'

const app = createApp(App)

authStore.init().then(() => {
    app.use(router)
    app.mount('#app')
})
