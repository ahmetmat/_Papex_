import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const baseClasses =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'border-transparent bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
  destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
  outline: 'text-slate-700 border-slate-200',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
