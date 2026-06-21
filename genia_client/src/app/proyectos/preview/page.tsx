'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Table, Palette, Settings, Download, Eye, Edit } from 'lucide-react';

interface Dashboard {
  nombre: string;
  idioma: string;
  moneda: string;
  zona_horaria: string;
  formato_fecha: string;
}

interface Estilo {
  nombre: string;
  tema: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  fuente: string;
  activo: boolean;
}

interface Columna {
  nombre: string;
  etiqueta: string;
  tipo_dato: string;
  requerido: boolean;
  unico: boolean;
  max_length: number | null;
  mascara: string | null;
  valores_permitidos: string[] | null;
  multivalor: boolean;
  valor_defecto: string | null;
  expresion_regular: string | null;
  condicion_visible: string | null;
  busqueda_habilitada: boolean;
  tabla_busqueda: string | null;
  orden: number;
  ancho: string;
  input_type: string;
  icono: string;
  placeholder: string | null;
  clase_css: string | null;
}

interface Fila {
  orden: number;
  datos: Record<string, string>;
}

interface Relacion {
  columna_origen: string;
  tabla_destino: string;
  columna_destino: string;
  tipo: string;
  nombre_relacion: string;
}

interface Tabla {
  nombre: string;
  etiqueta: string;
  icono: string;
  orden: number;
  columnas: Columna[];
  filas: Fila[];
  relaciones: Relacion[];
}

interface ERPData {
  dashboard: Dashboard;
  estilos: Estilo[];
  tablas: Tabla[];
}

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [erpData, setErpData] = useState<ERPData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsLightMode(savedTheme === 'light');

    // Obtener datos del ERP desde localStorage
    const erpDataStr = localStorage.getItem('currentERPData');
    if (erpDataStr) {
      try {
        const data = JSON.parse(erpDataStr);
        setErpData(data);
        if (data.tablas && data.tablas.length > 0) {
          setSelectedTable(data.tablas[0].nombre);
        }
      } catch (e) {
        console.error('Error parsing ERP data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    const nextTheme = !isLightMode;
    setIsLightMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'light' : 'dark');
  };

  if (!mounted || !erpData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#121224] to-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando preview...</p>
        </div>
      </div>
    );
  }

  const currentTable = erpData.tablas.find(t => t.nombre === selectedTable);
  const activeStyle = erpData.estilos.find(e => e.activo) || erpData.estilos[0];

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
      isLightMode 
        ? 'bg-gradient-to-b from-[#f9fafb] via-[#f3f4f6] to-[#f9fafb] text-gray-900' 
        : 'bg-gradient-to-b from-[#0a0a0a] via-[#121224] to-[#0a0a0a] text-white'
    }`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${
        isLightMode 
          ? 'border-gray-200 bg-white/80 backdrop-blur-md' 
          : 'border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md'
      }`}>
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/proyectos')}
              className={`flex items-center gap-2 transition-colors ${
                isLightMode ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <span className={isLightMode ? 'text-gray-300' : 'text-gray-600'}>/</span>
            <span className={`font-semibold ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>
              Preview ERP
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isLightMode 
                  ? 'bg-purple-100 border-purple-200 text-purple-600 hover:bg-purple-200' 
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
              }`}
            >
              {isLightMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1">
        {/* Dashboard Info */}
        <div className={`border rounded-2xl p-6 mb-6 backdrop-blur-md transition-colors duration-300 ${
          isLightMode 
            ? 'bg-white border-purple-500/20 shadow-md' 
            : 'bg-[#11111e]/60 border-purple-500/10'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{erpData.dashboard.nombre}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full ${
                isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {erpData.dashboard.idioma.toUpperCase()}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full ${
                isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {erpData.dashboard.moneda}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={isLightMode ? 'text-gray-600' : 'text-gray-400'}>Zona Horaria:</span>
              <span className="ml-2 font-medium">{erpData.dashboard.zona_horaria}</span>
            </div>
            <div>
              <span className={isLightMode ? 'text-gray-600' : 'text-gray-400'}>Formato Fecha:</span>
              <span className="ml-2 font-medium">{erpData.dashboard.formato_fecha}</span>
            </div>
          </div>

          {/* Estilos */}
          {activeStyle && (
            <div className="mt-4 pt-4 border-t border-purple-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4" />
                <span className="font-semibold">Tema: {activeStyle.nombre}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/20" 
                    style={{ backgroundColor: activeStyle.color_primario }}
                  ></div>
                  <span className="text-xs">Primario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/20" 
                    style={{ backgroundColor: activeStyle.color_secundario }}
                  ></div>
                  <span className="text-xs">Secundario</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/20" 
                    style={{ backgroundColor: activeStyle.color_acento }}
                  ></div>
                  <span className="text-xs">Acento</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tables Navigation */}
        <div className={`border rounded-2xl p-4 mb-6 backdrop-blur-md transition-colors duration-300 ${
          isLightMode 
            ? 'bg-white border-purple-500/20 shadow-md' 
            : 'bg-[#11111e]/60 border-purple-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Table className="w-5 h-5" />
            <h2 className="font-semibold">Tablas del Sistema</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {erpData.tablas.map((tabla) => (
              <button
                key={tabla.nombre}
                onClick={() => setSelectedTable(tabla.nombre)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTable === tabla.nombre
                    ? isLightMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isLightMode
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                }`}
              >
                {tabla.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Details */}
        {currentTable && (
          <div className={`border rounded-2xl p-6 backdrop-blur-md transition-colors duration-300 ${
            isLightMode 
              ? 'bg-white border-purple-500/20 shadow-md' 
              : 'bg-[#11111e]/60 border-purple-500/10'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">{currentTable.etiqueta}</h2>
                <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {currentTable.columnas.length} columnas • {currentTable.filas.length} registros
                </p>
              </div>
            </div>

            {/* Columnas */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Estructura de Columnas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentTable.columnas.map((col) => (
                  <div
                    key={col.nombre}
                    className={`p-3 rounded-lg border ${
                      isLightMode 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-[#1a1a2e] border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{col.etiqueta}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {col.tipo_dato}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {col.requerido && (
                        <span className={`px-2 py-0.5 rounded ${
                          isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                        }`}>
                          Requerido
                        </span>
                      )}
                      {col.unico && (
                        <span className={`px-2 py-0.5 rounded ${
                          isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                        }`}>
                          Único
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datos de Ejemplo */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Datos de Ejemplo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isLightMode ? 'bg-gray-100' : 'bg-[#1a1a2e]'}>
                      {currentTable.columnas.slice(0, 5).map((col) => (
                        <th
                          key={col.nombre}
                          className={`px-4 py-3 text-left text-sm font-semibold ${
                            isLightMode ? 'text-gray-700' : 'text-gray-300'
                          }`}
                        >
                          {col.etiqueta}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTable.filas.map((fila, idx) => (
                      <tr
                        key={idx}
                        className={`border-t ${
                          isLightMode 
                            ? 'border-gray-200 hover:bg-gray-50' 
                            : 'border-purple-500/10 hover:bg-[#1a1a2e]/50'
                        }`}
                      >
                        {currentTable.columnas.slice(0, 5).map((col) => (
                          <td
                            key={col.nombre}
                            className={`px-4 py-3 text-sm ${
                              isLightMode ? 'text-gray-700' : 'text-gray-300'
                            }`}
                          >
                            {fila.datos[col.nombre] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Relaciones */}
            {currentTable.relaciones.length > 0 && (
              <div className="mt-6 pt-6 border-t border-purple-500/10">
                <h3 className="font-semibold mb-3">Relaciones</h3>
                <div className="space-y-2">
                  {currentTable.relaciones.map((rel, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        isLightMode ? 'bg-gray-50' : 'bg-[#1a1a2e]'
                      }`}
                    >
                      <span className="font-medium">{rel.columna_origen}</span>
                      <span className={isLightMode ? 'text-gray-600 mx-2' : 'text-gray-400 mx-2'}>→</span>
                      <span>{rel.tabla_destino}.{rel.columna_destino}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${
                        isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {rel.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => {
              // Descargar JSON
              const dataStr = JSON.stringify(erpData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${erpData.dashboard.nombre.replace(/\s+/g, '_')}_config.json`;
              link.click();
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              isLightMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <Download className="w-5 h-5" />
            Descargar Configuración
          </button>
          
          <button
            onClick={() => router.push('/proyectos')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isLightMode
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Finalizar
          </button>
        </div>
      </main>
    </div>
  );
}

