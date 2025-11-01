import * as React from 'react';
import { cn } from '../../lib/utils';

const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fixed bottom-4 right-4 flex w-80 flex-col gap-2', className)}
      {...props}
    />
  ),
);
ToastViewport.displayName = 'ToastViewport';

const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-md border bg-white p-4 shadow', className)} {...props} />
  ),
);
Toast.displayName = 'Toast';

const ToastTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h6 ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
  ),
);
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-600', className)} {...props} />
  ),
);
ToastDescription.displayName = 'ToastDescription';

const ToastAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn('text-sm font-medium text-slate-900', className)} {...props} />
  ),
);
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn('text-xs text-slate-500', className)} {...props} />
  ),
);
ToastClose.displayName = 'ToastClose';

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};
