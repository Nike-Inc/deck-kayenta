import { module } from 'angular';

import { CANARY_SCORE_COMPONENT } from './canaryScore.component';

export const CANARY_COMPONENTS = 'spinnaker.kayenta.components.module';
module(CANARY_COMPONENTS, [CANARY_SCORE_COMPONENT]);
