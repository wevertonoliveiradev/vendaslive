import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function Register() {
  const { signUp } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<RegisterForm>();
  
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await signUp(data.email, data.password, data.fullName);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Conta criada com sucesso! Você já pode fazer login.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta. Tente novamente.');
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
            Crie sua conta para começar
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="fullName" className="label">Nome Completo</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                className={`input ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Seu nome completo"
                {...register('fullName', { 
                  required: 'Nome completo é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'O nome deve ter pelo menos 3 caracteres'
                  }
                })}
              />
              {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
            </div>
            
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
                autoComplete="new-password"
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
            
            <div>
              <label htmlFor="confirmPassword" className="label">Confirmar Senha</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`input ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Confirme sua senha"
                {...register('confirmPassword', { 
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === password || 'As senhas não conferem'
                })}
              />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;