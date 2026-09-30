import React from 'react';
import { ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedProps {
  requiredRole?: string;
  onReturnToDashboard?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole, onReturnToDashboard }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#0B2545] p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden text-white">
        {/* Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-700/60 text-rose-400 mb-4 shadow-lg">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Access Restricted
        </h2>

        <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed mb-6">
          Your current account (<span className="font-semibold text-amber-300">{user?.name}</span> • <span className="font-mono text-emerald-300">{user?.role}</span>) does not have authorization to view the {requiredRole || 'requested'} portal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onReturnToDashboard && (
            <button
              onClick={onReturnToDashboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all cursor-pointer shadow-md"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Return to My Dashboard</span>
            </button>
          )}

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-rose-700/80 bg-rose-950/40 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
