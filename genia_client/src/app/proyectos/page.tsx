'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProyectosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Verificar autenticación
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      router.replace('/');
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center">
      <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
        Hola
      </h1>
    </div>
  );
}

// Made with Bob