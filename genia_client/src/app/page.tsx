'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RegistroModal from '@/components/RegistroModal';
import LoginModal from '@/components/LoginModal';
import AuthPromptModal from '@/components/AuthPromptModal';

interface Usuario {
  nombre?: string;
  appat?: string;
  email?: string;
  user_metadata?: {
    nombre?: string;
    appat?: string;
  };
}

export default function LandingPage() {
  const router = useRouter();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsuario(user);
      } catch (error) {
        console.error('Error al parsear usuario:', error);
      }
    }

    const animated = sessionStorage.getItem('hasAnimated');
    if (animated) {
      setHasAnimated(true);
      setVisibleSections(new Set(['hero', 'about', 'features', 'interface', 'vision', 'cta']));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    sessionStorage.setItem('hasAnimated', 'true');

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const isVisible = (sectionId: string) => {
    return hasAnimated || visibleSections.has(sectionId);
  };

  const handleGoToProjects = () => {
    if (usuario) {
      router.push('/proyectos');
    } else {
      setIsAuthPromptOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUsuario(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-purple-500/10">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/new_logo.png"
                alt="GenIA Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                GenIA
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#about" className="text-gray-300 hover:text-white transition-colors tracking-wide">
                About
              </a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors tracking-wide">
                Features
              </a>
              {usuario ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {usuario.nombre || usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Usuario'}
                      {usuario.appat ? ` ${usuario.appat}` : usuario.user_metadata?.appat ? ` ${usuario.user_metadata.appat}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border-2 border-red-500/50 rounded-full text-red-400 font-semibold tracking-wide hover:bg-red-500/10 transition-all text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-6 py-2 border-2 border-purple-500/50 rounded-full text-white font-semibold tracking-wide hover:bg-purple-500/10 transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold tracking-wide hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section
        id="hero"
        data-animate
        className={`relative overflow-hidden min-h-screen flex items-center justify-center px-6 pt-20 transition-all duration-1000 ${
          isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-[700ms]"></div>
        </div>

        <div className="w-full max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-wider">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Unleash the power of
            </span>
            <br />
            <span className="text-white">intelligent ERP systems</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed px-4 tracking-wide">
            Say goodbye to outdated business management tools. Every small and medium business owner,
            regardless of their background, can now manage their business like a pro. Simple.
            Intuitive. And never boring.
          </p>
          {!usuario && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg tracking-wide hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Get Started
              </button>
              <button className="px-8 py-4 border-2 border-purple-500/50 rounded-full text-white font-semibold text-lg tracking-wide hover:bg-purple-500/10 transition-all">
                Learn more
              </button>
            </div>
          )}
        </div>
      </section>

      <section
        id="interface"
        data-animate
        className={`py-24 md:py-32 px-6 transition-all duration-1000 delay-[200ms] relative ${
          isVisible('interface') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/20">
            <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg font-semibold tracking-wide">Interface Preview</p>
                <p className="text-gray-500 text-sm mt-2 tracking-wide">Your ERP dashboard will appear here</p>
              </div>
            </div>
          </div>
          
          {/* Botón "Ir a mis proyectos" */}
          <div className="mt-8 text-center">
            <button
              onClick={handleGoToProjects}
              className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white font-bold text-lg tracking-wide hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
            >
              Ir a mis proyectos →
            </button>
          </div>
        </div>
      </section>

      <section
        id="about"
        data-animate
        className={`py-24 md:py-32 px-6 transition-all duration-1000 delay-[300ms] relative overflow-hidden ${
          isVisible('about') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-wider">
                Who said ERP systems have to be boring?
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed tracking-wide">
                With GenIA, managing your business operations is effortless, empowering, and anything but boring.
                Our intuitive platform brings clarity to your workflows, simplifies your business management,
                and puts the power of advanced ERP systems right at your fingertips.
              </p>
              <p className="text-purple-400 font-semibold text-lg tracking-wide">
                Say no to complex systems designed in the 80s.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-[#1a1a2e] p-8 rounded-3xl border border-purple-500/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg tracking-wide">AI-Powered</h3>
                      <p className="text-gray-400 tracking-wide">Intelligent automation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg tracking-wide">Customizable</h3>
                      <p className="text-gray-400 tracking-wide">Tailored to your needs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg tracking-wide">Secure</h3>
                      <p className="text-gray-400 tracking-wide">Enterprise-grade security</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        data-animate
        className={`py-24 md:py-32 px-6 transition-all duration-1000 delay-[400ms] relative ${
          isVisible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider">
              Everything you need.
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Nothing you don't
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto tracking-wide">
              Business management and visibility in one place. Experience{' '}
              <span className="text-purple-400 font-semibold">a flexible toolkit</span> that makes every task feel like a breeze.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10">
              <div className="mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Insights at your fingertips</h3>
              <p className="text-gray-400 leading-relaxed tracking-wide">
                All your data and finances in one place to provide quick answers and make decisions instantly.
              </p>
            </div>

            <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Manage in real time</h3>
              <p className="text-gray-400 leading-relaxed tracking-wide">
                Have full control of your business operations on the go using our iOS/Android mobile apps. Because, you know, it's 2026.
              </p>
            </div>

            <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all hover:shadow-xl hover:shadow-pink-500/10">
              <div className="mb-6">
                <div className="w-full h-48 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Important business alerts</h3>
              <p className="text-gray-400 leading-relaxed tracking-wide">
                Choose the alerts you need and receive them via email, mobile or Slack. Review and take action in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="vision"
        data-animate
        className={`py-24 md:py-32 px-6 transition-all duration-1000 delay-[500ms] relative ${
          isVisible('vision') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider">Our Vision</h2>
          <p className="text-gray-400 text-lg leading-relaxed px-4 tracking-wide">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </section>

      <section
        id="cta"
        data-animate
        className={`py-24 md:py-32 px-6 transition-all duration-1000 delay-[600ms] relative overflow-hidden ${
          isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-[#1a1a2e] p-12 md:p-16 rounded-3xl border border-purple-500/20 text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider">
                Ready to transform your business?
              </h2>
              <p className="text-gray-400 text-xl tracking-wide">
                Join thousands of businesses already using GenIA to streamline their operations.
              </p>
              {!usuario && (
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold text-xl tracking-wide hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-purple-500/10 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/new_logo.png"
                alt="GenIA Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                GenIA
              </span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors tracking-wide">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors tracking-wide">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors tracking-wide">Contact</a>
            </div>
            <p className="text-gray-500 text-sm tracking-wide">© 2026 GenIA. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <AuthPromptModal
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
        onLogin={() => {
          setIsAuthPromptOpen(false);
          setIsLoginModalOpen(true);
        }}
        onRegister={() => {
          setIsAuthPromptOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegistroModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
    </div>
  );
}

// Made with Bob
