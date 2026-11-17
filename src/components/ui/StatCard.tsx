'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-primary',
  variant = 'default'
}) => {
  const borderVariants = {
    default: 'border-border',
    primary: 'border-primary/40 shadow-primary/5',
    success: 'border-success/40 shadow-success/5',
    warning: 'border-warning/40 shadow-warning/5',
    danger: 'border-danger/40 shadow-danger/5'
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-slate-700 ${borderVariants[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`rounded-lg bg-slate-800/80 p-2.5 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          {trend && (
            <span
              className={`inline-flex items-center font-medium ${
                trend.isPositive ? 'text-success' : 'text-danger'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
          {trend?.label && <span>{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
