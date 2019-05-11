import { module } from 'angular';

import { CANARY_COMPONENTS } from 'kayenta/components/components.module';

// load all templates into the $templateCache
const templates = require.context('./', true, /\.html$/);
templates.keys().forEach(function(key) {
  templates(key);
});

// const modules = [CANARY_COMPONENTS, CANARY_DATA_SOURCE, CANARY_STATES];
// const modules = [CANARY_COMPONENTS];

export const KAYENTA_MODULE = 'spinnaker.kayenta';
// module(KAYENTA_MODULE, [...modules]);
