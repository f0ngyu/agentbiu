import { createApp } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faCircleCheck,
  faCircleExclamation,
  faGlobe,
  faImage,
  faKey,
  faLink,
  faRocket,
  faShieldHalved,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import App from './App.vue';
import './styles/main.css';

library.add(
  faBolt,
  faCircleCheck,
  faCircleExclamation,
  faGlobe,
  faImage,
  faKey,
  faLink,
  faRocket,
  faShieldHalved,
  faWallet,
);

const app = createApp(App);
app.component('FontAwesomeIcon', FontAwesomeIcon);
app.mount('#app');
