'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Check,
  Layout,
  Database,
  Users,
  Sparkles,
  Building,
  HelpCircle,
  FileText,
  AlertTriangle,
  Monitor,
  Phone,
  Unlock,
  Layers,
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';

// Secciones del formulario
const SECCIONES = [
  { id: 1, titulo: 'Tipo de negocio', icono: Building },
  { id: 2, titulo: 'Tamaño', icono: Layers },
  { id: 3, titulo: 'Operación', icono: Monitor },
  { id: 4, titulo: 'Módulos', icono: Layout },
  { id: 5, titulo: 'Flujo de trabajo', icono: Sparkles },
  { id: 6, titulo: 'Tecnología', icono: Unlock },
  { id: 7, titulo: 'Datos existentes', icono: Database },
  { id: 8, titulo: 'Validación final', icono: Check }
];

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [seccionActiva, setSeccionActiva] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading');
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsLightMode(savedTheme === 'light');
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

  // Estados del Formulario
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [otroTipoNegocio, setOtroTipoNegocio] = useState('');
  const [tamano, setTamano] = useState({ num_empleados: '', num_sucursales: '' });
  
  const [operacion, setOperacion] = useState<{
    atiende_clientes: boolean | null;
    vende_productos: boolean | null;
    vende_servicios: boolean | null;
    maneja_inventario: boolean | null;
    tiene_empleados: boolean | null;
    maneja_proveedores: boolean | null;
    realiza_compras: boolean | null;
  }>({
    atiende_clientes: null,
    vende_productos: null,
    vende_servicios: null,
    maneja_inventario: null,
    tiene_empleados: null,
    maneja_proveedores: null,
    realiza_compras: null
  });

  const [modulosDeseados, setModulosDeseados] = useState<string[]>([]);
  
  const [flujo, setFlujo] = useState({
    clientes: { registro_actual: '', info_guardada: [] as string[] },
    inventario: { controla: [] as string[], alertas_bajo_stock: null as boolean | null },
    citas: { metodo_actual: [] as string[], recordatorios_automaticos: null as boolean | null },
    empleados: { control_asistencias: null as boolean | null, control_comisiones: null as boolean | null }
  });

  const [tecnologia, setTecnologia] = useState<{
    usan_computadora: boolean | null;
    usan_celular: boolean | null;
    acceso_remoto: boolean | null;
    niveles_acceso: boolean | null;
  }>({
    usan_computadora: null,
    usan_celular: null,
    acceso_remoto: null,
    niveles_acceso: null
  });

  const [datosExistentes, setDatosExistentes] = useState<{
    tiene_datos: string;
    archivos: { nombre: string; tamaño: string; base64?: string }[];
  }>({
    tiene_datos: '',
    archivos: []
  });

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      router.replace('/');
      return;
    }
    
    try {
      setUsuario(JSON.parse(userStr));
    } catch (e) {
      console.error(e);
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === 'Loading...') return 'Loading';
        if (prev === 'Loading..') return 'Loading...';
        if (prev === 'Loading.') return 'Loading..';
        return 'Loading.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Lista de preguntas dinámicas basada en la selección
  const getActiveQuestions = () => {
    const list = [
      { id: 'nombre_negocio', answered: !!nombreNegocio },
      { id: 'tipo_negocio', answered: !!tipoNegocio && (tipoNegocio !== 'Otro' || !!otroTipoNegocio) },
      { id: 'num_empleados', answered: !!tamano.num_empleados },
      { id: 'num_sucursales', answered: !!tamano.num_sucursales },
      { id: 'atiende_clientes', answered: operacion.atiende_clientes !== null },
      { id: 'vende_productos', answered: operacion.vende_productos !== null },
      { id: 'vende_servicios', answered: operacion.vende_servicios !== null },
      { id: 'maneja_inventario', answered: operacion.maneja_inventario !== null },
      { id: 'tiene_empleados', answered: operacion.tiene_empleados !== null },
      { id: 'maneja_proveedores', answered: operacion.maneja_proveedores !== null },
      { id: 'realiza_compras', answered: operacion.realiza_compras !== null },
      { id: 'modulos_deseados', answered: modulosDeseados.length > 0 }
    ];

    if (modulosDeseados.includes('Clientes')) {
      list.push({ id: 'clientes_registro', answered: !!flujo.clientes.registro_actual });
      list.push({ id: 'clientes_info', answered: flujo.clientes.info_guardada.length > 0 });
    }
    if (modulosDeseados.includes('Inventario')) {
      list.push({ id: 'inventario_controla', answered: flujo.inventario.controla.length > 0 });
      list.push({ id: 'inventario_alertas', answered: flujo.inventario.alertas_bajo_stock !== null });
    }
    if (modulosDeseados.includes('Citas')) {
      list.push({ id: 'citas_metodo', answered: flujo.citas.metodo_actual.length > 0 });
      list.push({ id: 'citas_recordatorios', answered: flujo.citas.recordatorios_automaticos !== null });
    }
    if (modulosDeseados.includes('Empleados')) {
      list.push({ id: 'empleados_asistencia', answered: flujo.empleados.control_asistencias !== null });
      list.push({ id: 'empleados_comisiones', answered: flujo.empleados.control_comisiones !== null });
    }

    list.push(
      { id: 'tecnologia_comp', answered: tecnologia.usan_computadora !== null },
      { id: 'tecnologia_cel', answered: tecnologia.usan_celular !== null },
      { id: 'tecnologia_remoto', answered: tecnologia.acceso_remoto !== null },
      { id: 'tecnologia_niveles', answered: tecnologia.niveles_acceso !== null },
      { id: 'importar_datos', answered: !!datosExistentes.tiene_datos }
    );

    if (datosExistentes.tiene_datos && datosExistentes.tiene_datos !== 'No') {
      list.push({ id: 'archivos', answered: datosExistentes.archivos.length > 0 });
    }

    return list;
  };

  const getProgressInfo = () => {
    const active = getActiveQuestions();
    const answeredCount = active.filter(q => q.answered).length;
    const percentage = Math.round((answeredCount / active.length) * 100);
    return { percentage, answeredCount, total: active.length };
  };

  const { percentage, answeredCount, total } = getProgressInfo();

  // Calcular la inferencia de IA en la sección 8
  const getInferredAI = () => {
    const totalModules = modulosDeseados.length;
    
    // Screens logic
    let screens = 5; 
    if (totalModules > 0) screens += totalModules * 1;
    if (tecnologia.acceso_remoto) screens += 1;
    if (datosExistentes.tiene_datos && datosExistentes.tiene_datos !== 'No') screens += 1;

    // Tables logic
    let tables = 6;
    if (totalModules > 0) tables += totalModules * 2;
    if (operacion.maneja_inventario) tables += 2;
    if (operacion.maneja_proveedores) tables += 1;

    // Roles logic
    let roles = 2; // Admin, Staff
    if (tecnologia.niveles_acceso) {
      roles = 3;
      if (modulosDeseados.includes('Clientes') && operacion.atiende_clientes) {
        roles = 4; // Admin, Manager, Staff, Customer
      }
    }

    return { screens, tables, roles };
  };

  const aiInference = getInferredAI();

  // Handlers
  const toggleModulo = (mod: string) => {
    if (modulosDeseados.includes(mod)) {
      setModulosDeseados(modulosDeseados.filter(m => m !== mod));
    } else {
      setModulosDeseados([...modulosDeseados, mod]);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const loadedFiles: typeof datosExistentes.archivos = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        loadedFiles.push({
          nombre: file.name,
          tamaño: (file.size / 1024).toFixed(1) + ' KB',
          base64: reader.result as string
        });
        setDatosExistentes(prev => ({
          ...prev,
          archivos: [...prev.archivos, ...loadedFiles]
        }));
      };
    });
  };

  const removeFile = (index: number) => {
    setDatosExistentes(prev => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== index)
    }));
  };

  const handleNextSection = () => {
    if (seccionActiva < 8) {
      setSeccionActiva(seccionActiva + 1);
    }
  };

  const handlePrevSection = () => {
    if (seccionActiva > 1) {
      setSeccionActiva(seccionActiva - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const payload = {
      nombre_negocio: nombreNegocio,
      tipo_negocio: tipoNegocio === 'Otro' ? otroTipoNegocio : tipoNegocio,
      tamano,
      operacion,
      modulos_deseados: modulosDeseados,
      flujo: {
        clientes: modulosDeseados.includes('Clientes') ? flujo.clientes : undefined,
        inventario: modulosDeseados.includes('Inventario') ? flujo.inventario : undefined,
        citas: modulosDeseados.includes('Citas') ? flujo.citas : undefined,
        empleados: modulosDeseados.includes('Empleados') ? flujo.empleados : undefined
      },
      tecnologia,
      datos_existentes: datosExistentes,
      base_de_datos_existente: null
    };

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${backendUrl}/proyecto/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      
      // Guardar el proyecto devuelto en localStorage (independientemente si viene de base de datos o mockup del backend)
      const localProyectosStr = localStorage.getItem('proyectos') || '[]';
      const localProyectos = JSON.parse(localProyectosStr);
      localProyectos.push(resData.data || {
        id: 'local-' + Math.random().toString(36).substring(2, 9),
        nombre_negocio: nombreNegocio || `Mi ${payload.tipo_negocio}`,
        configuracion: payload,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('proyectos', JSON.stringify(localProyectos));

      setSuccess(true);
      setTimeout(() => {
        router.push('/proyectos');
      }, 3000);

    } catch (error) {
      console.error('Error al guardar el proyecto en el servidor:', error);
      
      // Fallback local: Guardar en localStorage de todos modos para que el hackathon funcione sin internet/backend local
      const localProyectosStr = localStorage.getItem('proyectos') || '[]';
      const localProyectos = JSON.parse(localProyectosStr);
      const mockProject = {
        id: 'local-' + Math.random().toString(36).substring(2, 9),
        nombre_negocio: nombreNegocio || `Mi ${payload.tipo_negocio}`,
        configuracion: payload,
        created_at: new Date().toISOString()
      };
      localProyectos.push(mockProject);
      localStorage.setItem('proyectos', JSON.stringify(localProyectos));

      setSuccess(true);
      setTimeout(() => {
        router.push('/proyectos');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen w-full flex flex-col pb-24 transition-colors duration-300 ${
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
              <span>Panel</span>
            </button>
            <span className={isLightMode ? 'text-gray-300' : 'text-gray-600'}>/</span>
            <span className={`font-semibold ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>Configurar Negocio</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isLightMode 
                  ? 'bg-purple-100 border-purple-200 text-purple-600 hover:bg-purple-200' 
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
              }`}
              title="Cambiar tema"
            >
              {isLightMode ? (
                // Moon Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                // Sun Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-3">
              <Image src="/new_logo.png" alt="GenIA Logo" width={32} height={32} className="object-contain" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                GenIA Wizard
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="md:col-span-1 space-y-3 animate-fade-in">
          <div className={`border rounded-2xl p-5 backdrop-blur-md sticky top-24 transition-colors duration-300 ${
            isLightMode 
              ? 'bg-white border-purple-500/20 shadow-md shadow-purple-500/5' 
              : 'bg-[#11111e]/60 border-purple-500/10'
          }`}>
            <h3 className={`text-sm font-bold tracking-wider uppercase mb-4 ${
              isLightMode ? 'text-gray-500' : 'text-gray-400'
            }`}>Secciones</h3>
            <div className="space-y-1">
              {SECCIONES.map((sec) => {
                const Icon = sec.icono;
                const isActive = seccionActiva === sec.id;
                const isCompleted = getActiveQuestions().every(q => {
                  if (sec.id === 1) return q.id !== 'tipo_negocio' || q.answered;
                  if (sec.id === 2) return (q.id !== 'num_empleados' && q.id !== 'num_sucursales') || q.answered;
                  if (sec.id === 3) return !q.id.startsWith('atiende_') && q.id !== 'vende_productos' && q.id !== 'vende_servicios' && q.id !== 'maneja_inventario' && q.id !== 'tiene_empleados' && q.id !== 'maneja_proveedores' && q.id !== 'realiza_compras' || q.answered;
                  if (sec.id === 4) return q.id !== 'modulos_deseados' || q.answered;
                  if (sec.id === 5) return !q.id.startsWith('clientes_') && !q.id.startsWith('inventario_') && !q.id.startsWith('citas_') && !q.id.startsWith('empleados_') || q.answered;
                  if (sec.id === 6) return !q.id.startsWith('tecnologia_') || q.answered;
                  if (sec.id === 7) return (q.id !== 'importar_datos' && q.id !== 'archivos') || q.answered;
                  return true;
                });

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSeccionActiva(sec.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? isLightMode
                          ? 'bg-purple-100 border border-purple-300 text-purple-700 shadow-md shadow-purple-500/5'
                          : 'bg-purple-600/20 border border-purple-500/30 text-white shadow-lg shadow-purple-500/5'
                        : isLightMode
                          ? 'hover:bg-gray-100 border border-transparent text-gray-600 hover:text-gray-900'
                          : 'hover:bg-white/5 border border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                      <span className="text-sm font-semibold tracking-wide text-left">{sec.titulo}</span>
                    </div>
                    {isCompleted && (
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isLightMode 
                          ? 'bg-cyan-100 border-cyan-300' 
                          : 'bg-cyan-500/20 border border-cyan-500/30'
                      }`}>
                        <Check className={`w-3 h-3 ${isLightMode ? 'text-cyan-600' : 'text-cyan-400'}`} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <section className="md:col-span-3 flex flex-col justify-between">
          <div className={`border rounded-3xl p-8 backdrop-blur-md shadow-2xl relative min-h-[500px] flex flex-col justify-between transition-colors duration-300 ${
            isLightMode 
              ? 'bg-white border-purple-500/20 text-gray-900 shadow-purple-500/5' 
              : 'bg-[#11111e]/40 border-purple-500/10 text-white'
          }`}>
            
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center animate-fade-in py-12">
                <div className="relative w-56 h-56 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 flex items-center justify-center bg-black/40">
                  <video
                    src="/Animacion_loading.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scale(1.1)', animation: 'spin 12s linear infinite' }}
                  />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
                    {loadingText}
                  </h2>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    El agente inteligente de GenIA está estructurando tus pantallas, bases de datos y accesos. Esto puede tomar unos segundos.
                  </p>
                </div>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center animate-fade-in py-12">
                <div className="relative w-56 h-56 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 flex items-center justify-center bg-black/40">
                  <video
                    src="/Animacion_loading.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scale(1.1)', animation: 'spin 12s linear infinite' }}
                  />
                </div>
                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ¡Negocio Configurado!
                </h2>
                <p className="text-gray-400 text-lg max-w-md">
                  El agente inteligente de GenIA está estructurando tus pantallas, bases de datos y accesos.
                  Redireccionando a tu panel de control...
                </p>
              </div>
            ) : (
              <>
                {/* Form fields depending on active section */}
                <div className="space-y-6">
                  {/* SECCIÓN 1: Tipo de negocio */}
                  {seccionActiva === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className={`text-base font-bold tracking-wide ${
                            isLightMode ? 'text-gray-700' : 'text-gray-200'
                          }`}>
                            Nombre de tu negocio
                          </label>
                          <input
                            type="text"
                            value={nombreNegocio}
                            onChange={(e) => setNombreNegocio(e.target.value)}
                            placeholder="Ej. Barbería El Vikingo, Pets & Co..."
                            className={`w-full max-w-lg px-4 py-3 border rounded-xl transition-colors focus:outline-none focus:border-purple-500 ${
                              isLightMode 
                                ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400' 
                                : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="border-t border-purple-500/10 pt-4">
                        <h2 className="text-2xl font-bold tracking-wide">¿Cuál es tu tipo de negocio?</h2>
                        <p className={`text-sm mb-4 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          Selecciona la industria o tipo que mejor describa tu negocio principal.
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {[
                            'Barbería', 'Estética', 'Gimnasio', 'Restaurante', 'Cafetería',
                            'Veterinaria', 'Consultorio médico', 'Consultorio dental',
                            'Taller mecánico', 'Tienda de ropa', 'Ferretería',
                            'Papelería', 'Farmacia', 'Escuela', 'Otro'
                          ].map((neg) => (
                            <button
                              key={neg}
                              onClick={() => {
                                setTipoNegocio(neg);
                                if (neg !== 'Otro') setOtroTipoNegocio('');
                              }}
                              className={`p-4 rounded-2xl border text-center font-medium tracking-wide transition-all ${
                                tipoNegocio === neg
                                  ? isLightMode
                                    ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-md shadow-purple-500/5'
                                    : 'bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border-purple-500 shadow-xl shadow-purple-500/10'
                                  : isLightMode
                                    ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                                    : 'bg-[#18182a]/50 border-white/5 hover:border-white/10 hover:bg-[#1a1a32]/70'
                              }`}
                            >
                                {neg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {tipoNegocio === 'Otro' && (
                        <div className="space-y-2">
                          <label className={`text-sm font-semibold ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
                            Escribe el tipo de negocio:
                          </label>
                          <input
                            type="text"
                            value={otroTipoNegocio}
                            onChange={(e) => setOtroTipoNegocio(e.target.value)}
                            placeholder="Ej. Estudio de tatuajes, Florería..."
                            className={`w-full max-w-md px-4 py-3 border rounded-xl focus:outline-none focus:border-purple-500 transition-colors ${
                              isLightMode 
                                ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400' 
                                : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 2: Tamaño */}
                  {seccionActiva === 2 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Tamaño de tu negocio</h2>
                        <p className="text-gray-400 text-sm">Ayúdanos a entender el tamaño del equipo y su presencia física.</p>
                      </div>

                      {/* Personas */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-purple-400">¿Cuántas personas trabajan en tu negocio?</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {['Solo yo', '2 a 5', '6 a 20', '21 a 50', 'Más de 50'].map((op) => (
                            <button
                              key={op}
                              onClick={() => setTamano({ ...tamano, num_empleados: op })}
                              className={`p-3 rounded-xl border text-sm font-medium tracking-wide transition-all ${
                                tamano.num_empleados === op
                                  ? 'bg-purple-600/30 border-purple-500 text-white'
                                  : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sucursales */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-cyan-400">¿Cuántas sucursales tienes?</h3>
                        <div className="grid grid-cols-3 gap-3 max-w-md">
                          {['1', '2 a 5', 'Más de 5'].map((op) => (
                            <button
                              key={op}
                              onClick={() => setTamano({ ...tamano, num_sucursales: op })}
                              className={`p-3 rounded-xl border text-sm font-medium tracking-wide transition-all ${
                                tamano.num_sucursales === op
                                  ? 'bg-cyan-600/30 border-cyan-500 text-white'
                                  : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 3: Operación */}
                  {seccionActiva === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Detalles de Operación</h2>
                        <p className="text-gray-400 text-sm">Define las actividades clave de tu negocio.</p>
                      </div>
                      <div className="space-y-4 max-w-2xl">
                        {[
                          { key: 'atiende_clientes', label: '¿Atiendes clientes directamente?' },
                          { key: 'vende_productos', label: '¿Vendes productos?' },
                          { key: 'vende_servicios', label: '¿Vendes servicios?' },
                          { key: 'maneja_inventario', label: '¿Manejas inventario?' },
                          { key: 'tiene_empleados', label: '¿Tienes empleados?' },
                          { key: 'maneja_proveedores', label: '¿Manejas proveedores?' },
                          { key: 'realiza_compras', label: '¿Realizas compras de suministros o insumos?' }
                        ].map((op) => (
                          <div
                            key={op.key}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#18182a]/40 border border-white/5 rounded-2xl gap-3"
                          >
                            <span className="font-medium tracking-wide">{op.label}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setOperacion({ ...operacion, [op.key]: true })}
                                className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                  operacion[op.key as keyof typeof operacion] === true
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-[#18182a]/50 border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setOperacion({ ...operacion, [op.key]: false })}
                                className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                  operacion[op.key as keyof typeof operacion] === false
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-[#18182a]/50 border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 4: Módulos a Resolver */}
                  {seccionActiva === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">¿Qué áreas deseas administrar?</h2>
                        <p className="text-gray-400 text-sm">Selecciona todos los módulos que te gustaría incluir en tu ERP.</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          'Clientes', 'Ventas', 'Inventario', 'Compras', 'Proveedores',
                          'Empleados', 'Nómina', 'Citas', 'Reservaciones', 'Membresías',
                          'Facturación', 'Cobranza', 'Reportes', 'Documentos', 'Otro'
                        ].map((mod) => {
                          const isSelected = modulosDeseados.includes(mod);
                          return (
                            <button
                              key={mod}
                              onClick={() => toggleModulo(mod)}
                              className={`p-4 rounded-2xl border text-center font-medium tracking-wide transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border-purple-500 text-white shadow-xl shadow-purple-500/10'
                                  : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-gray-500'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </span>
                                <span>{mod}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 5: Flujo de trabajo (Dinámico) */}
                  {seccionActiva === 5 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Personalización del Flujo de Trabajo</h2>
                        <p className="text-gray-400 text-sm">Configuremos preguntas específicas según las secciones que marcaste anteriormente.</p>
                      </div>

                      {modulosDeseados.length === 0 && (
                        <div className="text-center p-8 bg-[#18182a]/30 border border-white/5 rounded-2xl">
                          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No seleccionaste ningún módulo clave (Clientes, Inventario, Citas, Empleados) en la sección anterior.</p>
                          <p className="text-gray-500 text-sm mt-1">Puedes continuar a la siguiente sección sin configurar flujos dinámicos.</p>
                        </div>
                      )}

                      {/* Clientes */}
                      {modulosDeseados.includes('Clientes') && (
                        <div className="space-y-4 p-6 bg-[#18182a]/30 border border-purple-500/10 rounded-2xl">
                          <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Configuración: Clientes
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">¿Actualmente registras clientes?</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['No', 'En libreta', 'Excel', 'Otro sistema'].map((op) => (
                                  <button
                                    key={op}
                                    onClick={() => setFlujo({ ...flujo, clientes: { ...flujo.clientes, registro_actual: op } })}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                      flujo.clientes.registro_actual === op
                                        ? 'bg-purple-600/30 border-purple-500'
                                        : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                                    }`}
                                  >
                                    {op}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">¿Qué información guardas de tus clientes?</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['Nombre', 'Teléfono', 'Correo', 'Dirección', 'RFC', 'Historial de compras'].map((info) => {
                                  const isSelected = flujo.clientes.info_guardada.includes(info);
                                  return (
                                    <button
                                      key={info}
                                      onClick={() => {
                                        const exists = flujo.clientes.info_guardada.includes(info);
                                        const newInfo = exists
                                          ? flujo.clientes.info_guardada.filter(i => i !== info)
                                          : [...flujo.clientes.info_guardada, info];
                                        setFlujo({ ...flujo, clientes: { ...flujo.clientes, info_guardada: newInfo } });
                                      }}
                                      className={`p-3 rounded-xl border text-sm transition-all ${
                                        isSelected
                                          ? 'bg-cyan-600/20 border-cyan-500 text-white'
                                          : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                                      }`}
                                    >
                                      {info}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inventario */}
                      {modulosDeseados.includes('Inventario') && (
                        <div className="space-y-4 p-6 bg-[#18182a]/30 border border-purple-500/10 rounded-2xl">
                          <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                            <Database className="w-5 h-5" /> Configuración: Inventario
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">¿Qué controlas en tu inventario?</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Productos', 'Herramientas', 'Materia prima', 'Equipos'].map((op) => {
                                  const isSelected = flujo.inventario.controla.includes(op);
                                  return (
                                    <button
                                      key={op}
                                      onClick={() => {
                                        const exists = flujo.inventario.controla.includes(op);
                                        const newCtrl = exists
                                          ? flujo.inventario.controla.filter(c => c !== op)
                                          : [...flujo.inventario.controla, op];
                                        setFlujo({ ...flujo, inventario: { ...flujo.inventario, controla: newCtrl } });
                                      }}
                                      className={`p-3 rounded-xl border text-sm transition-all ${
                                        isSelected
                                          ? 'bg-cyan-600/20 border-cyan-500 text-white'
                                          : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                                      }`}
                                    >
                                      {op}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#18182a]/40 border border-white/5 rounded-xl">
                              <span className="text-sm font-semibold text-gray-300">¿Deseas alertas por inventario bajo?</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setFlujo({ ...flujo, inventario: { ...flujo.inventario, alertas_bajo_stock: true } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.inventario.alertas_bajo_stock === true
                                      ? 'bg-purple-600 border-purple-500 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setFlujo({ ...flujo, inventario: { ...flujo.inventario, alertas_bajo_stock: false } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.inventario.alertas_bajo_stock === false
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Citas */}
                      {modulosDeseados.includes('Citas') && (
                        <div className="space-y-4 p-6 bg-[#18182a]/30 border border-purple-500/10 rounded-2xl">
                          <h3 className="text-lg font-bold text-pink-400 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" /> Configuración: Citas
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-300 mb-2">¿Cómo agendas citas actualmente?</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['WhatsApp', 'Excel', 'Agenda física', 'Otro sistema'].map((op) => {
                                  const isSelected = flujo.citas.metodo_actual.includes(op);
                                  return (
                                    <button
                                      key={op}
                                      onClick={() => {
                                        const exists = flujo.citas.metodo_actual.includes(op);
                                        const newMet = exists
                                          ? flujo.citas.metodo_actual.filter(m => m !== op)
                                          : [...flujo.citas.metodo_actual, op];
                                        setFlujo({ ...flujo, citas: { ...flujo.citas, metodo_actual: newMet } });
                                      }}
                                      className={`p-3 rounded-xl border text-sm transition-all ${
                                        isSelected
                                          ? 'bg-cyan-600/20 border-cyan-500 text-white'
                                          : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                                      }`}
                                    >
                                      {op}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#18182a]/40 border border-white/5 rounded-xl">
                              <span className="text-sm font-semibold text-gray-300">¿Deseas recordatorios automáticos?</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setFlujo({ ...flujo, citas: { ...flujo.citas, recordatorios_automaticos: true } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.citas.recordatorios_automaticos === true
                                      ? 'bg-purple-600 border-purple-500 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setFlujo({ ...flujo, citas: { ...flujo.citas, recordatorios_automaticos: false } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.citas.recordatorios_automaticos === false
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Empleados */}
                      {modulosDeseados.includes('Empleados') && (
                        <div className="space-y-4 p-6 bg-[#18182a]/30 border border-purple-500/10 rounded-2xl">
                          <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Configuración: Empleados
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-[#18182a]/40 border border-white/5 rounded-xl">
                              <span className="text-sm font-semibold text-gray-300">¿Deseas controlar asistencias?</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setFlujo({ ...flujo, empleados: { ...flujo.empleados, control_asistencias: true } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.empleados.control_asistencias === true
                                      ? 'bg-purple-600 border-purple-500 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setFlujo({ ...flujo, empleados: { ...flujo.empleados, control_asistencias: false } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.empleados.control_asistencias === false
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#18182a]/40 border border-white/5 rounded-xl">
                              <span className="text-sm font-semibold text-gray-300">¿Deseas controlar comisiones de ventas?</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setFlujo({ ...flujo, empleados: { ...flujo.empleados, control_comisiones: true } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.empleados.control_comisiones === true
                                      ? 'bg-purple-600 border-purple-500 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setFlujo({ ...flujo, empleados: { ...flujo.empleados, control_comisiones: false } })}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    flujo.empleados.control_comisiones === false
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-[#18182a]/50 border-white/5 text-gray-400'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 6: Tecnología */}
                  {seccionActiva === 6 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Infraestructura y Tecnología</h2>
                        <p className="text-gray-400 text-sm">¿Cómo interactuará tu equipo con la plataforma?</p>
                      </div>
                      <div className="space-y-4 max-w-2xl">
                        {[
                          { key: 'usan_computadora', label: '¿Tus empleados usarán computadora para el sistema?' },
                          { key: 'usan_celular', label: '¿Tus empleados usarán celular/tablet para el sistema?' },
                          { key: 'acceso_remoto', label: '¿Necesitas acceso remoto fuera del local físico?' },
                          { key: 'niveles_acceso', label: '¿Necesitas diferentes niveles de acceso (roles/permisos)?' }
                        ].map((op) => (
                          <div
                            key={op.key}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#18182a]/40 border border-white/5 rounded-2xl gap-3"
                          >
                            <span className="font-medium tracking-wide">{op.label}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setTecnologia({ ...tecnologia, [op.key]: true })}
                                className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                  tecnologia[op.key as keyof typeof tecnologia] === true
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500 text-white'
                                    : 'bg-[#18182a]/50 border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setTecnologia({ ...tecnologia, [op.key]: false })}
                                className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                  tecnologia[op.key as keyof typeof tecnologia] === false
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-[#18182a]/50 border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 7: Datos existentes */}
                  {seccionActiva === 7 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Importación de Datos Existentes</h2>
                        <p className="text-gray-400 text-sm">¿Tienes bases de datos o archivos que quieras migrar al nuevo sistema?</p>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-gray-300">¿Tienes información que quieras importar?</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {['Excel', 'Google Sheets', 'CSV', 'Otro sistema', 'No'].map((op) => (
                            <button
                              key={op}
                              onClick={() => setDatosExistentes({ ...datosExistentes, tiene_datos: op })}
                              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                datosExistentes.tiene_datos === op
                                  ? 'bg-purple-600/30 border-purple-500 text-white'
                                  : 'bg-[#18182a]/50 border-white/5 hover:border-white/10'
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      {datosExistentes.tiene_datos && datosExistentes.tiene_datos !== 'No' && (
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-gray-300">Sube tus archivos:</p>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              handleFileUpload(e.dataTransfer.files);
                            }}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                              dragOver
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-purple-500/20 hover:border-purple-500/40 bg-[#18182a]/30'
                            }`}
                          >
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFileUpload(e.target.files)}
                              id="file-upload"
                              className="hidden"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                              <Upload className="w-10 h-10 text-purple-400 mx-auto" />
                              <div>
                                <span className="text-purple-400 font-bold hover:underline">Haz clic para subir</span> o arrastra y suelta aquí tu archivo
                              </div>
                              <p className="text-xs text-gray-500">Excel, CSV o texto plano hasta 10 MB</p>
                            </label>
                          </div>

                          {datosExistentes.archivos.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Archivos Seleccionados</p>
                              <div className="space-y-2">
                                {datosExistentes.archivos.map((file, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-[#18182a]/50 border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                      <FileSpreadsheet className="w-5 h-5 text-green-400" />
                                      <div>
                                        <p className="text-sm font-semibold text-gray-200">{file.nombre}</p>
                                        <p className="text-xs text-gray-500">{file.tamaño}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeFile(i)}
                                      className="text-xs text-red-400 hover:text-red-300 font-semibold"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 8: Validación final (Inferencia de IA) */}
                  {seccionActiva === 8 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-wide">Validación Final de GenIA</h2>
                        <p className="text-gray-400 text-sm">Nuestro agente ha inferido la arquitectura ideal para tu nuevo ERP.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tablas */}
                        <div className="p-6 bg-gradient-to-br from-cyan-950/20 to-black border border-cyan-500/20 rounded-3xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center">
                            <Database className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-black text-white">{aiInference.tables}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tablas Relacionales</p>
                          </div>
                        </div>

                        {/* Roles */}
                        <div className="p-6 bg-gradient-to-br from-pink-950/20 to-black border border-pink-500/20 rounded-3xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-pink-500/20 border border-pink-500/30 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-pink-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-black text-white">{aiInference.roles}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Roles de Acceso</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-[#18182a]/30 border border-white/5 rounded-3xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-200">Requerimientos Detectados:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {modulosDeseados.map((mod) => (
                            <div key={mod} className="flex items-center gap-2 text-sm text-gray-300">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              </div>
                              <span>Gestión de {mod.toLowerCase()}</span>
                            </div>
                          ))}
                          {operacion.maneja_inventario && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              </div>
                              <span>Control de inventario físico</span>
                            </div>
                          )}
                          {tecnologia.acceso_remoto && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              </div>
                              <span>Acceso Remoto Seguro (SSL/CORS)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center pt-4">
                        <p className="text-lg font-semibold mb-3">¿Deseas continuar y desplegar tu sistema?</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center border-t border-purple-500/10 pt-6 mt-8">
                  <button
                    onClick={handlePrevSection}
                    disabled={seccionActiva === 1}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold transition-all text-sm ${
                      seccionActiva === 1
                        ? 'opacity-30 cursor-not-allowed border-white/5 text-gray-500'
                        : 'border-white/10 hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  {seccionActiva === 8 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !tipoNegocio}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <span>Generar ERP</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextSection}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/30 rounded-xl font-bold transition-all text-sm"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Floating Bottom Progress Bar */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 py-3 px-6 backdrop-blur-lg flex items-center justify-between shadow-2xl transition-colors duration-300 ${
        isLightMode 
          ? 'bg-white/90 border-t border-blue-500/20 text-gray-900 shadow-blue-500/5' 
          : 'bg-[#07070e]/90 border-t border-blue-500/20 text-white'
      }`}>
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Progress details */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${
              isLightMode ? 'bg-blue-100 border-blue-300' : 'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <span className={`text-xs font-black ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>{percentage}%</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Progreso del Formulario</p>
              <p className={`text-sm font-bold ${isLightMode ? 'text-gray-800' : 'text-gray-200'}`}>
                {answeredCount} de {total} preguntas contestadas
              </p>
            </div>
          </div>

          {/* Blue progress track */}
          <div className={`flex-1 max-w-xl w-full h-3 rounded-full overflow-hidden relative border ${
            isLightMode ? 'bg-gray-100 border-gray-300' : 'bg-blue-950/40 border-blue-500/10'
          }`}>
            <div
              style={{ width: `${percentage}%` }}
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-blue-500/40"
            />
          </div>

          {/* Summary status tag */}
          <div className="hidden sm:block">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border ${
              isLightMode 
                ? 'bg-blue-100 border-blue-200 text-blue-600' 
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            }`}>
              {percentage === 100 ? 'COMPLETADO' : 'EN PROGRESO'}
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
