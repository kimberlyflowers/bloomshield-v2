const paths = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  home: 'm3 10 9-7 9 7v10h-6v-6H9v6H3z',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  marketplace: 'M4 9h16l-2-6H6L4 9Zm0 0v12h16V9M9 21v-7h6v7',
  wallet: 'M20 8V5H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h16v-4m1-8H4m17 0v8h-6a4 4 0 0 1 0-8h6Zm-5 4h.01',
  profile: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',
  settings: 'M4 6h4m4 0h8M4 12h10m4 0h2M4 18h4m4 0h8M8 4v4m6 2v4m-6 2v4',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-10 2 2 4-4',
  file: 'M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6',
};

export default function WorkspaceIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
