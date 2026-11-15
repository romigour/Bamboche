import { mount } from 'svelte';
import './lib/theme/global.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import { initUpdater } from './lib/update';

initUpdater(registerSW);

export default mount(App, { target: document.getElementById('app')! });
