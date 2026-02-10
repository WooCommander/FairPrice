import { createApp } from 'vue'
import './styles/main.scss'
import App from './App.vue'
import router from './router'


const app = createApp(App)

app.use(router)

// Initialize Auth
import { authStore } from '@/modules/auth/store/authStore'

authStore.init().then(() => {
    app.mount('#app')
})
