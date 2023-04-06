export type NotificationType = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Notification {
  id?: string;
  name: string;
  description: string;
  userId: string;
  read?: boolean;
  link: string;
  notificationType: NotificationType;
}
