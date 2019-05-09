import * as React from 'react';
import ConfigDetail from './configDetail';

/**
 * Isolated Canary Configuration Editor Component with embedded store.
 *
 */
export default class IsolatedCanaryConfigurationEditor extends React.Component {
  public render(): React.ReactNode {
    return (
      <div>
        <ConfigDetail />
      </div>
    );
  }
}
