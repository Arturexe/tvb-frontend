import { createApp } from 'vue'
import App from './app.vue'
import router from './utils/router.js'
import './assets/css/main.css'

const app = createApp(App)

app
  .use(router)
  .mount('#app')
