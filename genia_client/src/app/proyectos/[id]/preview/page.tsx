'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// Datos estáticos del gimnasio PowerFit
const POWERFIT_DATA = {
  "dashboard": {
    "nombre": "Gimnasio PowerFit",
    "idioma": "es",
    "moneda": "MXN",
    "zona_horaria": "America/Mexico_City",
    "formato_fecha": "DD/MM/YYYY"
  },
  "estilos": [
    {
      "nombre": "Tema PowerFit",
      "tema": "dark",
      "color_primario": "#f97316",
      "color_secundario": "#1e293b",
      "color_acento": "#22c55e",
      "fuente": "Inter",
      "activo": true
    }
  ],
  "tablas": [
    {
      "nombre": "planes",
      "etiqueta": "Planes de Membresía",
      "icono": "dumbbell",
      "orden": 1
    },
    {
      "nombre": "clientes",
      "etiqueta": "Clientes del Gimnasio",
      "icono": "users",
      "orden": 2
    }
  ]
};

interface Usuario {
  id: string;
  nombre?: string;
  email?: string;
  user_metadata?: {
    nombre?: string;
  };
}

export default function PreviewERPPage() {
  const router = useRouter();
  const params = useParams();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
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
      console.error('Error:', error);
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleEditar = () => {
    router.push(`/proyectos/${params.id}/modificar`);
  };

  const handleDescargar = () => {
    // Crear el contenido HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>En Proceso</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
        }
        .container {
            text-align: center;
            color: white;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚧 En Proceso 🚧</h1>
        <p>Este proyecto está siendo generado...</p>
    </div>
</body>
</html>`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    
    const aHtml = document.createElement('a');
    aHtml.href = htmlUrl;
    aHtml.download = `erp-${POWERFIT_DATA.dashboard.nombre.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(aHtml);
    aHtml.click();
    document.body.removeChild(aHtml);
    URL.revokeObjectURL(htmlUrl);
  };

  if (!usuario) {
    return null;
  }

  const displayName = usuario.nombre || usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/proyectos')}
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

            <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Layout Grid: Descripción a la izquierda, Mockups a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Descripción General - Izquierda */}
          <div className="lg:col-span-5">
            <div className="bg-[#11111e]/40 border border-purple-500/10 rounded-3xl backdrop-blur-md p-8 h-full">
              <h2 className="text-white text-2xl font-bold mb-6">Descripción General</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Nombre del Sistema:</p>
                  <p className="text-white text-lg font-semibold">{POWERFIT_DATA.dashboard.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Idioma:</p>
                  <p className="text-white font-medium">{POWERFIT_DATA.dashboard.idioma === 'es' ? 'Español' : POWERFIT_DATA.dashboard.idioma}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Moneda:</p>
                  <p className="text-white font-medium">{POWERFIT_DATA.dashboard.moneda}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Zona Horaria:</p>
                  <p className="text-white font-medium">{POWERFIT_DATA.dashboard.zona_horaria}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Formato de Fecha:</p>
                  <p className="text-white font-medium">{POWERFIT_DATA.dashboard.formato_fecha}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-500 text-sm mb-2">Tema:</p>
                  <p className="text-white font-medium">{POWERFIT_DATA.estilos[0].nombre}</p>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: POWERFIT_DATA.estilos[0].color_primario }}></div>
                      <span className="text-xs text-gray-400">Primario</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: POWERFIT_DATA.estilos[0].color_secundario }}></div>
                      <span className="text-xs text-gray-400">Secundario</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: POWERFIT_DATA.estilos[0].color_acento }}></div>
                      <span className="text-xs text-gray-400">Acento</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-500 text-sm mb-2">Módulos Incluidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {POWERFIT_DATA.tablas.map((tabla) => (
                      <span key={tabla.nombre} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 font-medium">
                        {tabla.etiqueta}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mockups Grid - Derecha */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {/* Título de Mockups */}
              <div className="grid grid-cols-3 gap-4">
                {['Mockups', 'Mockups', 'Mockups'].map((label, idx) => (
                  <div key={idx} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-center">
                    <span className="text-purple-400 font-semibold text-sm">{label}</span>
                  </div>
                ))}
              </div>

              {/* Grid 3x2 de mockups (6 cajas grises) */}
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-gray-700/30 border border-gray-600/30 rounded-xl aspect-square flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleEditar}
            className="px-6 py-3 bg-[#11111e] border-2 border-purple-500 hover:bg-purple-500/10 rounded-xl text-white font-bold tracking-wide hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={handleDescargar}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold tracking-wide hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar
          </button>
        </div>

        {/* Back Button */}
        <div>
          <button
            onClick={() => router.push('/proyectos')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a proyectos
          </button>
        </div>
      </main>
    </div>
  );
}

// Made with Bob