'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCirclePause,
  faCircleExclamation,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';

const STATUS_MAP = {
  active: { icon: faCircleCheck, label: 'Connected', className: 'text-success' },
  paused: { icon: faCirclePause, label: 'Paused', className: 'text-warning' },
  error: { icon: faCircleExclamation, label: 'Error', className: 'text-error' },
  revoked: { icon: faCircleXmark, label: 'Revoked', className: 'text-base-content/40' },
} as const;

interface ConnectionStatusProps {
  status: keyof typeof STATUS_MAP;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const { icon, label, className } = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-mono ${className}`}>
      <FontAwesomeIcon icon={icon} className="text-xs" />
      {label}
    </span>
  );
}
