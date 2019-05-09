import React from 'react';

import { storiesOf } from '@storybook/react';

import { IsolatedCanaryConfigurationEditor } from '@spinnaker/kayenta/reusable-components';

storiesOf('Config Editor', module).add('component', () => {
  return <IsolatedCanaryConfigurationEditor />;
});

storiesOf('Report Viewer', module)
  .add('Passing Report with no warnings', () => {
    return <div>todo</div>;
  })
  .add('Passing Report with warnings', () => {
    return <div>todo</div>;
  })
  .add('Failing Report with no warnings', () => {
    return <div>todo</div>;
  })
  .add('Failing Report with warnings', () => {
    return <div>todo</div>;
  });
