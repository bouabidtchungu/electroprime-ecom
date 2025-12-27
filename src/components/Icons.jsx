import React from 'react';

// --- Standard Icons (Used in Header & Footer) ---

export const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const ShoppingCartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.023.832l.97 4.992c.073.497.518.84.998.84h10.584c.48 0 .925-.343.998-.84l.97-4.992c.068-.489.513-.832 1.023-.832H21m-1.75 14.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-10 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

export const UserIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0v3.31a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-3.31z" />
  </svg>
);

// --- HomePage Value Proposition Icons (Used in HomePage.jsx) ---

export const TruckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.75 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12.603 18.258c-.71 0-1.41.111-2.115.328a2.25 2.25 0 01-1.393-2.115l.327-2.112a2.25 2.25 0 012.111-1.396h4.5c.966 0 1.897.41 2.535 1.118a4.5 4.5 0 011.66 3.012h-8.118zM18.75 12h.008v.008h-.008V12zm-3.75 0h.008v.008h-.008V12zm-12.75 0h.008v.008h-.008V12zm6.75 0h.008v.008h-.008V12z" />
  </svg>
);

export const ShieldCheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 5.168-3.924 9.424-9 9.932-5.076-.508-9-4.764-9-9.932V5.25c0-1.036.84-1.875 1.875-1.875h14.25c1.035 0 1.875.839 1.875 1.875V12z" />
  </svg>
);

export const ClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m-4.5 0a9 9 0 11-9 0 9 9 0 019-9z" />
  </svg>
);

// --- Utility Placeholders (Used in CategoryPage.jsx) ---

export const SortBy = () => (
  <div className="text-sm text-text-light">Sort: <select className="border rounded p-1"><option>Best Match</option></select></div>
);

export const Pagination = () => (
  <div className="flex space-x-2">
    <button className="py-2 px-4 border rounded text-text-light hover:bg-ui-border">Prev</button>
    <span className="py-2 px-4 border rounded bg-tech-primary text-white">1</span>
    <button className="py-2 px-4 border rounded text-text-light hover:bg-ui-border">2</button>
    <button className="py-2 px-4 border rounded text-text-light hover:bg-ui-border">Next</button>
  </div>
);