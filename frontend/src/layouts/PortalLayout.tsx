import { Outlet } from 'react-router-dom';

export const PortalLayout = () => {
  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="py-3 bg-white border-bottom">
        <div className="container">
          <span className="fw-bold fs-5 text-primary">Jobrythm</span>
        </div>
      </header>
      <main className="flex-fill py-4">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="py-3 border-top bg-white text-center text-secondary small">
        Powered by Jobrythm
      </footer>
    </div>
  );
};
