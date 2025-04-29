import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'h:mm a');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const formatTimeRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
};

export const formatDateTimeRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
}; 