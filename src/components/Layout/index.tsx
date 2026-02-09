import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen justify-around bg-gray-100">
      <Header />
      <div className="w-auto h-full flex-1 flex flex-col items-end">
        <main className="w-4/5 h-screen">{children}</main>
        <footer className="bg-gray-800 text-white text-center justify-safe-end py-4 mt-12 items-end">
          <p>&copy; 2024 Sistema de Gestión. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
