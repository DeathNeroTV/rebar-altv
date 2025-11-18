import { createApp } from 'vue';
import './style.css';
import './index.css';
import { PLUGIN_IMPORTS } from '../pages/plugins';
import { usePages } from '../composables/usePages';
import App from './App.vue';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons';    
import { far } from '@fortawesome/free-regular-svg-icons';    
import { fab } from '@fortawesome/free-brands-svg-icons';  

import DraggableVue from './components/Draggable.vue';

library.add(fas, far, fab);

const { init } = usePages();

const app = createApp(App);

for (let key of Object.keys(PLUGIN_IMPORTS)) {
    app.component(key, PLUGIN_IMPORTS[key]);
}

app.component('font-awesome-icon', FontAwesomeIcon);
app.component('Draggable', DraggableVue);
app.mount('#app');
init();
