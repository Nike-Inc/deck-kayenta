import * as React from 'react';
import classNames from 'classnames';

const ARROW_CLASS = 'arrow-down';

export interface IHeaderArrowProps {
  arrowColor: string;
  className?: string;
}

export default ({ arrowColor, className }: IHeaderArrowProps) => (
  <div className={classNames(ARROW_CLASS, className)} style={{ borderTopColor: arrowColor }} />
);
