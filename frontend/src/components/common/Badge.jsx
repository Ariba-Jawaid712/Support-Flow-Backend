import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Zap, 
  Flame, 
  ShieldAlert, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '-');

  const getIcon = () => {
    switch (normalized) {
      case 'pending':
        return <Clock size={13} />;
      case 'accepted':
        return <CheckCircle2 size={13} />;
      case 'in-progress':
        return <PlayCircle size={13} />;
      case 'resolved':
        return <CheckCircle2 size={13} />;
      case 'rejected':
        return <XCircle size={13} />;
      default:
        return <HelpCircle size={13} />;
    }
  };

  return (
    <span className={`badge badge-${normalized}`}>
      {getIcon()}
      {status || 'Unknown'}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const normalized = (priority || '').toLowerCase();

  const getIcon = () => {
    switch (normalized) {
      case 'urgent':
        return <Flame size={13} />;
      case 'critical':
        return <ShieldAlert size={13} />;
      case 'high':
        return <Zap size={13} />;
      case 'medium':
        return <AlertCircle size={13} />;
      default:
        return null;
    }
  };

  return (
    <span className={`badge badge-${normalized}`}>
      {getIcon()}
      {priority || 'Normal'}
    </span>
  );
};
