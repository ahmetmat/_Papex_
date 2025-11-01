// ui/dialog.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Dialog Context
interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Main Dialog Component
interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Dialog: React.FC<DialogProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const contextValue: DialogContextType = {
    open,
    setOpen,
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, setOpen]);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog Trigger Component
interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ 
  children, 
  asChild = false,
  className = ""
}) => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('DialogTrigger must be used within a Dialog');
  }

  const { setOpen } = context;

  const handleClick = () => {
    setOpen(true);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: `${(children as React.ReactElement).props.className || ''} ${className}`.trim(),
    });
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

// Dialog Content Component
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export const DialogContent: React.FC<DialogContentProps> = ({ 
  children, 
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true
}) => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('DialogContent must be used within a Dialog');
  }

  const { open, setOpen } = context;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />
          
          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className={`
              relative z-10 w-full max-h-[90vh] overflow-y-auto
              backdrop-blur-xl bg-white/95 border border-slate-200/50 
              rounded-2xl shadow-2xl
              mx-4 sm:mx-6 lg:mx-8
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="
                  absolute top-4 right-4 z-20
                  w-8 h-8 rounded-full
                  bg-slate-100/80 hover:bg-slate-200/80
                  border border-slate-200/50
                  flex items-center justify-center
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                "
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
            
            {/* Content */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Dialog Header Component
interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`px-6 py-6 border-b border-slate-200/50 ${className}`}>
      {children}
    </div>
  );
};

// Dialog Title Component
interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <h2 className={`text-2xl font-bold text-slate-900 leading-tight ${className}`}>
      {children}
    </h2>
  );
};

// Dialog Description Component
interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <p className={`text-slate-600 mt-2 leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

// Dialog Body Component
interface DialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogBody: React.FC<DialogBodyProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`px-6 py-6 ${className}`}>
      {children}
    </div>
  );
};

// Dialog Footer Component
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`
      px-6 py-4 border-t border-slate-200/50 
      bg-slate-50/30 rounded-b-2xl
      flex items-center justify-end gap-3
      ${className}
    `}>
      {children}
    </div>
  );
};

// Dialog Close Component (Alternative close trigger)
interface DialogCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const DialogClose: React.FC<DialogCloseProps> = ({ 
  children, 
  asChild = false,
  className = ""
}) => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('DialogClose must be used within a Dialog');
  }

  const { setOpen } = context;

  const handleClick = () => {
    setOpen(false);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      className: `${(children as React.ReactElement).props.className || ''} ${className}`.trim(),
    });
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

// Utility hook for using dialog context
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
};

// Export all components
export default {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  useDialog,
};

// Usage Examples:

/*
// Basic Usage:
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Controlled Usage:
function ControlledDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Controlled Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>NFT Details</DialogTitle>
          <DialogDescription>
            View and interact with this NFT
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <p>NFT content goes here...</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Custom styled dialog:
function CustomDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Custom Dialog</Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl"
        showCloseButton={true}
        closeOnOverlayClick={true}
      >
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="text-blue-900">
            Custom Styled Dialog
          </DialogTitle>
          <DialogDescription className="text-blue-700">
            This dialog has custom styling
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>Left content</div>
            <div>Right content</div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
*/