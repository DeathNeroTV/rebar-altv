import './src/api.js';
import { useRebarClient } from '@Client/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

view.show('Label', 'overlay');
view.show('Notify', 'persistent');