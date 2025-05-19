import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import { ArrowLeft, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';

type ForgotPasswordForm = {
  email: string;
};

function ForgotPassword() {
  const { resetPassword } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Link para redefinição de senha enviado. Verifique seu email.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar o email. Tente novamente.');
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
          <h1 className="mt-6 text-2xl font-bold text-white">Recuperar Senha</h1>
          <p className="mt-2 text-sm text-gray-400">
            Enviaremos um link para redefinir sua senha
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
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;