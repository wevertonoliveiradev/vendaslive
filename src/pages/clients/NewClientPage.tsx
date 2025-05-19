import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface ClientForm {
  name: string;
  email: string;
  phone: string;
}

function NewClientPage() {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ClientForm>();
  
  const onSubmit = async (data: ClientForm) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.from('clients').insert([
        {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          user_id: user.id,
        },
      ]);
      
      if (error) throw error;
      
      navigate('/clients');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar o cliente.');
      console.error('Error creating client:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/clients')}
          className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold">Novo Cliente</h1>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-group">
            <label htmlFor="name" className="label">Nome Completo *</label>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Nome do cliente"
              {...register('name', { 
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'O nome deve ter pelo menos 2 caracteres'
                }
              })}
            />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="label">Email (opcional)</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="email@exemplo.com"
              {...register('email', { 
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone" className="label">Telefone (opcional)</label>
            <input
              id="phone"
              type="text"
              className={`input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="(00) 00000-0000"
              {...register('phone')}
            />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-outline mr-2"
              onClick={() => navigate('/clients')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewClientPage;