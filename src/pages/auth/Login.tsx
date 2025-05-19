import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';

type LoginForm = {
  email: string;
  password: string;
};

function Login() {
  const { signIn } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginForm>();

  // Efeito para limpar a mensagem de erro após 5 segundos
  useEffect(() => {
    let timeoutId: number;
    
    if (error) {
      timeoutId = window.setTimeout(() => {
        setError(null);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [error]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: signInError } = await signIn(data.email, data.password);
      
      if (signInError) {
        // Verifica se o erro é de credenciais inválidas
        if (signInError.message === 'Invalid login credentials') {
          setError('Usuário ou senha inválidos. Tente novamente.');
        } else {
          setError('Ocorreu um erro ao fazer login. Tente novamente.');
        }
      }
    } catch (err: any) {
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
      console.error('Erro durante o login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-gray-900 p-8 rounded-xl shadow-lg animate-fade-in">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-violet-600">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">FotoVendas</h1>
          <p className="mt-2 text-sm text-gray-400">
            Faça login para acessar sua conta
          </p>
        </div>
        
        {error && (
          <div 
            className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative animate-fade-in" 
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="seu@email.com"
                {...register('email', { 
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="label">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Sua senha"
                {...register('password', { 
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter pelo menos 6 caracteres'
                  }
                })}
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="text-violet-400 hover:text-violet-300">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-violet-400 hover:text-violet-300">
                Registrar
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;