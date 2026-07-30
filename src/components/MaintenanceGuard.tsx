import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMaintenanceMode, isAdminLoggedIn } = useShop();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isMaintenanceMode && !isAdminRoute && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-bm-bg flex flex-col items-center justify-center p-6 text-center font-serif text-bm-text">
        <div className="max-w-md border border-bm-border bg-bm-card p-10 rounded-none shadow-sm">
          <span className="text-xs uppercase tracking-widest text-rho-teal font-sans mb-3 block">
            Rho Delta Chi Merch
          </span>
          <h1 className="text-3xl font-light mb-4">Shop Currently Closed</h1>
          <p className="font-sans text-sm text-bm-muted leading-relaxed mb-6">
            We are preparing for our next drop! Please check back during our upcoming order window or contact the fundraising chair.
          </p>
          <div className="w-12 h-[1px] bg-rho-rose mx-auto mb-6"></div>
          <Link
            to="/admin"
            className="inline-block font-sans text-[10px] uppercase tracking-widest text-rho-teal hover:text-rho-rose transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
