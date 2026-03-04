import './globals.css';

export const metadata = {
  title: 'Parabellum OS',
  description: 'Discipline. Performance. Protocol.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg" />
        <div className="grain" />
        <main className="shell">
          <header className="topbar">
            <div className="brand">
              <div className="sigil" />
              <div className="name">PARABELLUM OS</div>
            </div>
            <div className="status">alpha • v0</div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
