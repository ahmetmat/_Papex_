import * as React from 'react';
import { cn } from '../../lib/utils'

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

/**
 * A separator component for visually dividing content
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => {
    const ariaProps = decorative
      ? { 'aria-hidden': true }
      : { role: 'separator', 'aria-orientation': orientation };

    return (
      <div
        ref={ref}
        className={cn(
          'shrink-0 bg-gray-200 dark:bg-gray-700',
          orientation === 'horizontal' 
            ? 'h-[1px] w-full my-2' 
            : 'h-full w-[1px] mx-2',
          className
        )}
        {...ariaProps}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };