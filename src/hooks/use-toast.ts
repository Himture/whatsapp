import { toast } from "sonner";

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message, { duration: Number.POSITIVE_INFINITY }),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  message: (message: string) => toast(message),
};

export type Notify = typeof notify;
