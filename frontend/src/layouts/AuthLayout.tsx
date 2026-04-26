import type { ReactNode } from 'react';
import logoOnly from '../assets/Jobrythm_Logo-Only.png';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <div className="navbar-brand navbar-brand-autodark">
            <img src={logoOnly} alt="Jobrythm" height="36" />
          </div>
          <p className="text-secondary">Job costing and quoting for trades</p>
        </div>
        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-2">{title}</h2>
            <p className="text-secondary text-center mb-4">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

