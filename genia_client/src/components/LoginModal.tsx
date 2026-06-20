'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      console.log('🔐 ========== INICIANDO SESIÓN ==========');
      console.log('📍 URL:', `${API_URL}/usuario/login`);
      console.log('📦 JSON que se envía:');
      console.log(JSON.stringify(formData, null, 2));
      console.log('==========================================');
      
      const response = await fetch(`${API_URL}/usuario/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);

      const responseText = await response.text();
      console.log('📄 Response text:', responseText);

      if (!responseText || responseText.trim() === '') {
        throw new Error('El servidor no respondió con datos');
      }

      let parsedData = null;
      try {
        parsedData = JSON.parse(responseText);
        console.log('✅ Data parseada:', parsedData);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new Error(`El servidor respondió con texto no-JSON: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        
        if (parsedData && typeof parsedData === 'object') {
          if ('error' in parsedData) errorMsg = String(parsedData.error);
          else if ('message' in parsedData) errorMsg = String(parsedData.message);
        }
        
        console.error('❌ Error del servidor:', errorMsg);
        setError(errorMsg);
        return; // No continuar si hay error
      }

      if (!parsedData) {
        throw new Error('Respuesta del servidor vacía después de parsear');
      }

      console.log('🎉 Login exitoso!');
      console.log('📦 Datos recibidos:', parsedData);
      
      // El backend puede devolver diferentes estructuras
      let token = null;
      let userData = null;

      // Estructura 1: {ok: true, data: {...}, token: "..."}
      if (parsedData.ok && parsedData.data) {
        token = parsedData.token;
        userData = parsedData.data;
      }
      // Estructura 2: Respuesta de Supabase Auth {user: {...}, session: {...}}
      else if (parsedData.user || parsedData.session) {
        token = parsedData.session?.access_token || 'mock-token';
        userData = parsedData.user;
      }
      // Estructura 3: Error
      else if (parsedData.error || !parsedData.ok) {
        const errorMsg = parsedData.error || parsedData.message || 'Error al iniciar sesión';
        setError(errorMsg);
        return;
      }

      // Guardar token y datos de usuario en localStorage
      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token guardado');
      }
      
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Usuario guardado:', userData);
      }

      if (!token || !userData) {
        setError('No se recibieron datos de autenticación válidos');
        return;
      }

      // Cerrar modal y recargar la página para actualizar el estado
      onClose();
      window.location.reload();

    } catch (err) {
      console.error('💥 Error completo:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(`No se puede conectar al backend en ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}`);
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido al iniciar sesión');
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
              src="/l.png" 
              alt="GenIA" 
              width={40} 
              height={40}
              className="rounded-full"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-gray-400 text-center mb-6">
          Log in to access your account
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Tu contraseña"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Log In'}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
