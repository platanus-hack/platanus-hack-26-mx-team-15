'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface ProyectoDetalle {
  id: string;
  user_id?: string;
  nombre_negocio: string;
  configuracion?: {
    tipo_negocio?: string;
    tamano?: {
      num_empleados?: string;
      num_sucursales?: string;
    };
    modulos_deseados?: string[];
    dashboard?: {
      idioma?: string;
      moneda?: string;
      zona_horaria?: string;
      formato_fecha?: string;
    };
  };
  created_at: string;
}

interface Usuario {
  id: string;
  nombre?: string;
  email?: string;
  user_metadata?: {
    nombre?: string;
  };
}

export default function ProyectoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
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
      
      // Intentar obtener el proyecto del backend
      const fetchProyecto = async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${backendUrl}/proyecto/${params.id}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.ok && data.data) {
              setProyecto(data.data);
              return;
            }
          }
        } catch (err) {
          console.error('Error al obtener proyecto del backend:', err);
        }
        
        // Fallback: buscar en localStorage
        const localStr = localStorage.getItem('proyectos') || '[]';
        const proyectos = JSON.parse(localStr);
        const proyectoLocal = proyectos.find((p: any) => p.id === params.id);
        
        if (proyectoLocal) {
          setProyecto(proyectoLocal);
        } else {
          // Si no se encuentra, redirigir a la lista
          router.replace('/proyectos');
        }
      };
      
      fetchProyecto();
    } catch (error) {
      console.error('Error:', error);
      router.replace('/');
    }
  }, [router, params.id]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleModificar = () => {
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

    const config = proyecto?.configuracion || {};
    const dashboard = config.dashboard || {};
    
    // Crear la lógica del negocio
    const logicaContent = `# Lógica del Negocio - ${proyecto?.nombre_negocio}

## Información del Proyecto
- **ID**: ${proyecto?.id}
- **Nombre**: ${proyecto?.nombre_negocio}
- **Tipo de Negocio**: ${config.tipo_negocio || 'N/A'}
- **Idioma**: ${dashboard.idioma || 'N/A'}
- **Moneda**: ${dashboard.moneda || 'N/A'}
- **Zona Horaria**: ${dashboard.zona_horaria || 'N/A'}
- **Formato de Fecha**: ${dashboard.formato_fecha || 'N/A'}
- **Creado**: ${proyecto?.created_at ? new Date(proyecto.created_at).toLocaleString('es-MX') : 'N/A'}

## Descripción
Este documento contiene la lógica de negocio del proyecto ERP generado.

## Estado
🚧 En proceso de generación...

## Próximos Pasos
1. Configuración de módulos
2. Definición de flujos de trabajo
3. Integración de datos
4. Pruebas y validación
`;

    // Crear un Blob con el HTML
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    
    // Descargar HTML
    const aHtml = document.createElement('a');
    aHtml.href = htmlUrl;
    aHtml.download = `proyecto-${params.id}.html`;
    document.body.appendChild(aHtml);
    aHtml.click();
    document.body.removeChild(aHtml);
    URL.revokeObjectURL(htmlUrl);
    
    // Descargar lógica de negocio
    const logicaBlob = new Blob([logicaContent], { type: 'text/markdown' });
    const logicaUrl = URL.createObjectURL(logicaBlob);
    
    const aLogica = document.createElement('a');
    aLogica.href = logicaUrl;
    aLogica.download = `logica-negocio-${params.id}.md`;
    document.body.appendChild(aLogica);
    aLogica.click();
    document.body.removeChild(aLogica);
    URL.revokeObjectURL(logicaUrl);
  };

  if (!proyecto || !usuario) {
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
        {/* Project Card - Mismo estilo que las tarjetas de proyectos */}
        <div className="bg-[#11111e]/40 border border-purple-500/10 rounded-3xl backdrop-blur-md overflow-hidden shadow-xl p-6">
          {/* Header del proyecto */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400 inline-block mb-2">
                  {proyecto.configuracion?.tipo_negocio || 'ERP personalizado'}
                </span>
                <h1 className="text-white text-xl font-bold">{proyecto.nombre_negocio}</h1>
                <p className="text-gray-500 text-xs">ID: {proyecto.id}</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-black/20 rounded-lg text-white font-medium text-sm border border-white/10">
              logo
            </div>
          </div>

          {/* Content Area */}
          <div>
            {/* Information Section */}
            <div className="mb-6">
              <h2 className="text-white text-xl font-bold mb-4">Información del Proyecto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Nombre:</p>
                  <p className="text-white text-base font-semibold">{proyecto.nombre_negocio}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Tipo de Negocio:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.tipo_negocio || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Idioma:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.dashboard?.idioma || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Moneda:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.dashboard?.moneda || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Zona Horaria:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.dashboard?.zona_horaria || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Formato de Fecha:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.dashboard?.formato_fecha || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Empleados:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.tamano?.num_empleados || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1">Sucursales:</p>
                  <p className="text-white text-base font-semibold">{proyecto.configuracion?.tamano?.num_sucursales || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-xs font-medium mb-1">Creado:</p>
                  <p className="text-white text-base font-semibold">
                    {new Date(proyecto.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleModificar}
                className="px-6 py-3 bg-[#11111e] border-2 border-purple-500 hover:bg-purple-500/10 rounded-xl text-white font-bold tracking-wide hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modificar
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
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
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
