'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Usuario {
  nombre?: string;
  appat?: string;
  email?: string;
  user_metadata?: {
    nombre?: string;
    appat?: string;
  };
}

export default function ProyectosPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Verificar autenticación
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      router.replace('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsuario(user);
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleNuevoProyecto = () => {
    router.push('/proyectos/nuevo');
  };

  if (!mounted || !usuario) {
    return null;
  }

  const displayName = usuario.nombre || usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo y nombre */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/l.png"
                  alt="GenIA Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                  GenIA
                </span>
              </button>
            </div>

            {/* Right side: Search bar + User info */}
            <div className="flex items-center gap-4">
              {/* Search bar */}
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full px-4 py-2 pl-10 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* User info */}
              <div className="text-right">
                <p className="text-white font-semibold">{displayName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-red-500/50 rounded-full text-red-400 font-semibold tracking-wide hover:bg-red-500/10 transition-all text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Estado vacío */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          {/* Empty state */}
          <div className="text-center space-y-8 max-w-2xl">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/30">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
                No tienes proyectos aún
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Comienza creando tu primer proyecto ERP personalizado.
                <br />
                Gestiona tu negocio de manera inteligente y eficiente.
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleNuevoProyecto}
              className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-xl tracking-wide hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuevo Proyecto</span>
              </div>
            </button>

            {/* Additional info */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Rápido y fácil</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Personalizable</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Seguro</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
