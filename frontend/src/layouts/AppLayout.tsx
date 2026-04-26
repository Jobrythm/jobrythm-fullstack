import logoOnly from '../assets/Jobrythm_Logo-Only.png';
import {
  IconBriefcase,
  IconFileText,
  IconLayoutDashboard,
  IconMenu2,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconShieldLock,
} from '@tabler/icons-react';
import { type ComponentType, type ReactNode, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useJobs } from '../features/jobs/hooks/useJobs';
import { useAuth } from '../hooks/useAuth';
import { TopbarActionContext } from './topbarActionContext';
import { cn } from '../utils';
import { logout } from '../api/auth';

type SidebarLinkItem = {
  to: string;
  label: string;
  icon: ComponentType<{ size?: string | number }>;
  badge?: number;
  divider?: false;
};

type SidebarDividerItem = { divider: true };

type SidebarItem = SidebarLinkItem | SidebarDividerItem;


const titleMap: Record<string, string> = {
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  clients: 'Clients',
  quotes: 'Quotes',
  invoices: 'Invoices',
  settings: 'Settings',
  admin: 'Admin Console',
};

export const AppLayout = () => {
  const [topbarAction, setTopbarAction] = useState<ReactNode>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, clearAuth } = useAuth();
  const { data: activeJobsResponse } = useJobs({ status: 'active' });
  const activeJobs = activeJobsResponse?.items ?? [];

  const breadcrumb = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? parts : ['dashboard'];
  }, [location.pathname]);

  const pageTitle = titleMap[breadcrumb[0]] ?? 'Jobrythm';

  const navItems: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: IconBriefcase, badge: activeJobs.length },
    { to: '/clients', label: 'Clients', icon: IconUsers },
    { to: '/quotes', label: 'Quotes', icon: IconFileText },
    { to: '/invoices', label: 'Invoices', icon: IconReceipt },
    { divider: true },
    ...(user?.plan === 'admin' ? [{ to: '/admin', label: 'Admin', icon: IconShieldLock }] : []),
    { to: '/settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <TopbarActionContext.Provider value={{ setTopbarAction }}>
      <div className="page">
        <aside className={cn('navbar navbar-vertical navbar-expand-lg', mobileOpen ? 'show' : '')}>
          <div className="container-fluid">
            <button className="navbar-toggler" type="button" onClick={() => setMobileOpen((v) => !v)}>
              <IconMenu2 size={18} />
            </button>
            <Link to="/" className="navbar-brand navbar-brand-autodark">
              <img src={logoOnly} alt="Jobrythm" height="32" />
            </Link>
            <div className="collapse navbar-collapse show">
              <ul className="navbar-nav pt-lg-3">
                {navItems.map((item, index) => (
                  item.divider ? (
                    <li key={`divider-${index}`} className="nav-item mt-2 mb-2">
                      <hr className="navbar-divider" />
                    </li>
                  ) : (
                    <li key={item.to} className={cn('nav-item', location.pathname.startsWith(item.to) && 'active')}>
                      <Link to={item.to} className="nav-link" onClick={() => setMobileOpen(false)}>
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <item.icon size={18} />
                        </span>
                        <span className="nav-link-title">{item.label}</span>
                        {typeof item.badge === 'number' ? (
                          <span className="badge bg-blue-lt ms-auto">{item.badge}</span>
                        ) : null}
                      </Link>
                    </li>
                  )
                ))}
              </ul>

              <div className="mt-auto p-3 border-top">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="avatar avatar-sm">{user?.name?.slice(0, 1) ?? 'U'}</span>
                  <div>
                    <div className="small fw-bold">{user?.name ?? 'User'}</div>
                    <div className="text-secondary small">{user?.email}</div>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger w-100"
                  type="button"
                  onClick={() => {
                    if (session?.refreshToken) {
                      void logout({ refreshToken: session.refreshToken }).finally(() => navigate('/login'));
                    } else {
                      clearAuth();
                      navigate('/login');
                    }
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="page-wrapper">
          <header className="navbar navbar-expand-md d-print-none border-bottom">
            <div className="container-xl">
              <div className="d-flex w-100 justify-content-between align-items-center gap-2">
                <div>
                  <h2 className="page-title mb-1">{pageTitle}</h2>
                  <ol className="breadcrumb breadcrumb-arrows mb-0">
                    {breadcrumb.map((part) => (
                      <li key={part} className="breadcrumb-item text-capitalize">{part.replace('-', ' ')}</li>
                    ))}
                  </ol>
                </div>
                <div>{topbarAction}</div>
              </div>
            </div>
          </header>
          <div className="page-body">
            <div className="container-xl">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </TopbarActionContext.Provider>
  );
};

