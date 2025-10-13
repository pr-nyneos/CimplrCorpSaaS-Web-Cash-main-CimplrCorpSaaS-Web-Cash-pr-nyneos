import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle, 
  X, 
  Loader2 
} from "lucide-react";

// --- Add these types ---
type ConfirmOptions = {
  input?: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
};
type ConfirmResult = { confirmed: boolean; inputValue?: string };
// ---

type NotificationType = "success" | "error" | "info" | "warning" | "loading";

type Notification = {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number;
  persistent?: boolean;
  progress?: number;
};

type NotificationContextType = {
  notify: (
    message: string, 
    type?: NotificationType, 
    options?: { duration?: number; persistent?: boolean }
  ) => number;
  updateNotification: (id: number, updates: Partial<Notification>) => void;
  removeNotification: (id: number) => void;
  // --- Update confirm signature ---
  confirm: (message: string, options?: ConfirmOptions) => Promise<ConfirmResult>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }
  return context;
};

const NotificationIcon = ({ type, className = "" }: { type: NotificationType; className?: string }) => {
  const iconProps = { className: `${className} flex-shrink-0` };
  
  switch (type) {
    case "success":
      return <CheckCircle {...iconProps} />;
    case "error":
      return <XCircle {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    case "loading":
      return <Loader2 {...iconProps} className={`${iconProps.className} animate-spin`} />;
    default:
      return <Info {...iconProps} />;
  }
};

const NotificationItem = ({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: (id: number) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.persistent || notification.type === "loading") return;

    const duration = notification.type === "error" ? notification.duration || 10000 : 4000;
    const interval = 50;
    const decrement = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressTimer);
          handleRemove();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [notification]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = "relative overflow-hidden backdrop-blur-sm border";
    
    switch (notification.type) {
      case "success":
        return `${baseStyles} bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/25`;
      case "error":
        return `${baseStyles} bg-red-500/90 border-red-400 text-white shadow-red-500/25`;
      case "warning":
        return `${baseStyles} bg-amber-500/90 border-amber-400 text-white shadow-amber-500/25`;
      case "loading":
        return `${baseStyles} bg-blue-500/90 border-blue-400 text-white shadow-blue-500/25`;
      default:
        return `${baseStyles} bg-slate-800/90 border-slate-600 text-white shadow-slate-500/25`;
    }
  };

  return (
    <div
      className={`
        ${getNotificationStyles()}
        px-4 py-3 rounded-lg shadow-lg
        transform transition-all duration-300 ease-out
        ${isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        min-w-80 max-w-md
      `}
    >
      {!notification.persistent && notification.type !== "loading" && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
          <div 
            className="h-full bg-white/40 transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        <NotificationIcon 
          type={notification.type} 
          className="w-5 h-5 mt-0.5" 
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {notification.message}
          </p>
        </div>

        {(notification.persistent || notification.type === "loading") && (
          <button
            onClick={handleRemove}
            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // --- Add confirm options and input state ---
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (value: ConfirmResult) => void;
    options?: ConfirmOptions;
  } | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  // ---

  const notify = useCallback((
    message: string, 
    type: NotificationType = "info",
    options: { duration?: number; persistent?: boolean } = {}
  ) => {
    const id = Date.now() + Math.random();
    const newNotification: Notification = { 
      id, 
      message, 
      type,
      duration: options.duration,
      persistent: options.persistent
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const updateNotification = useCallback((id: number, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Update confirm to accept options and return input value ---
  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<ConfirmResult>((resolve) => {
      setConfirmState({ message, resolve, options });
    });
  }, []);
  // ---

  // --- Wrap context value in useMemo ---
  const contextValue = useMemo(
    () => ({
      notify,
      updateNotification,
      removeNotification,
      confirm,
    }),
    [notify, updateNotification, removeNotification, confirm]
  );
  // ---

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm space-y-4">
            <p className="text-sm font-medium text-gray-800">
              {confirmState.message}
            </p>
            {/* --- Input field if requested --- */}
            {confirmState.options?.input && (
              <div className="space-y-1">
                {confirmState.options.inputLabel && (
                  <label className="block text-xs font-medium text-gray-700">
                    {confirmState.options.inputLabel}
                  </label>
                )}
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder={confirmState.options.inputPlaceholder || ""}
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            {/* --- End input field --- */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  confirmState.resolve({ confirmed: false });
                  setConfirmState(null);
                  setConfirmInput("");
                }}
                className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmState.resolve({
                    confirmed: true,
                    inputValue: confirmInput,
                  });
                  setConfirmState(null);
                  setConfirmInput("");
                }}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
export default NotificationProvider;
