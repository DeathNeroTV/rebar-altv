import * as Bot from './bot.js';
import './api.js';
import * as Commands from './commands/index.js';
import * as Events from './events/index.js';

Bot.init();
Commands.init();
Events.init();