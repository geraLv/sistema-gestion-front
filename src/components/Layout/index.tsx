import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen justify-around bg-gray-100">
      <Header />
      <div className="w-full flex-1 flex flex-col md:ml-[20%] md:w-[80%] transition-all duration-300">
        <main className="w-full min-h-[calc(100vh-80px)]">{children}</main>
        <footer className="bg-gray-800 text-white text-center py-4 mt-auto">
          <p>&copy; 2024 Sistema de Gestión. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
