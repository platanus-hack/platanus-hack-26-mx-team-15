'use client';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function AuthPromptModal({ isOpen, onClose, onLogin, onRegister }: AuthPromptModalProps) {
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

        {/* Content */}
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Acceso Requerido
            </h2>
            <p className="text-gray-400">
              Inicia sesión o regístrate para acceder a tus proyectos
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full py-3 border-2 border-purple-500/50 rounded-lg text-white font-semibold hover:bg-purple-500/10 transition-all"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onRegister}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob