import { createApp } from 'vue'
import './styles/main.scss'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

const app = createApp(App)

app.use(router)

// Initialize Auth
const { initAuth } = useAuth()
initAuth().then(() => {
    app.mount('#app')
})
