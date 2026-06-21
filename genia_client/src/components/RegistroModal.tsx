'use client';

import { useState } from 'react';
import Image from 'next/image';

interface RegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegistroModal({ isOpen, onClose, onSwitchToLogin }: RegistroModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    appat: '',
    apmat: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      console.log('🚀 ========== ENVIANDO REGISTRO ==========');
      console.log('📍 URL:', `${API_URL}/usuario/registro`);
      console.log('📦 JSON que se envía:');
      console.log(JSON.stringify(formData, null, 2));
      console.table(formData);
      console.log('==========================================');
      
      const response = await fetch(`${API_URL}/usuario/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Intentar leer la respuesta como texto primero
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Verificar si hay contenido
      if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor no respondió con datos');
      }

      // Intentar parsear como JSON
      let data: { ok?: boolean; error?: string; message?: string; data?: any } | null = null;
      try {
        data = JSON.parse(responseText);
        console.log('Data parseada:', data);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`El servidor respondió con texto no-JSON: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Verificar que data existe antes de continuar
      if (!data) {
        throw new Error('Respuesta del servidor vacía');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          nombre: '',
          appat: '',
          apmat: '',
          fecha_nacimiento: '',
          telefono: '',
          email: '',
          password: ''
        });
      }, 2000);

    } catch (err) {
      console.error('Error completo:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(`No se puede conectar al backend en ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}`);
      } else {
        setError(err instanceof Error ? err.message : 'Error al registrar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Image 
              src="/new_logo.png" 
              alt="GenIA" 
              width={40} 
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
          Registro
        </h2>
        <p className="text-gray-400 text-center mb-6">
          Join our growing community and start managing your business like a pro
        </p>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center">
            ¡Registro exitoso! Bienvenido a GenIA
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>

          {/* Apellido Paterno */}
          <div>
            <label htmlFor="appat" className="block text-sm font-medium text-gray-300 mb-2">
              Apellido Paterno
            </label>
            <input
              type="text"
              id="appat"
              name="appat"
              value={formData.appat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Apellido paterno"
            />
          </div>

          {/* Apellido Materno */}
          <div>
            <label htmlFor="apmat" className="block text-sm font-medium text-gray-300 mb-2">
              Apellido Materno
            </label>
            <input
              type="text"
              id="apmat"
              name="apmat"
              value={formData.apmat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Apellido materno"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              maxLength={10}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="10 dígitos"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : ' Resgistrarse'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
