import * as React from 'react';

import { ICanaryMetricConfig, IMetricSetPair, ICanaryExecutionStatusResult } from 'kayenta/domain';
import { buildDelegateService } from 'kayenta/service/delegateFactory';

export interface IMetricResultScopeProps {
  metricConfig: ICanaryMetricConfig
  metricSetPair: IMetricSetPair;
  run: ICanaryExecutionStatusResult;
}

export interface IMetricStoreConfig {
  name: string;
  metricConfigurer: React.ComponentClass;
  queryFinder: (metric: ICanaryMetricConfig) => string;
  metricResultScope?: React.SFC<IMetricResultScopeProps> | React.ComponentClass<IMetricResultScopeProps>;
}

export default buildDelegateService<IMetricStoreConfig>();
