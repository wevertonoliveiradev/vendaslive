import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

function ClientsPage() {
  const { user } = useSupabase();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    fetchClients();
  }, [user]);
  
  const fetchClients = async (search?: string) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);
        
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchClients(searchTerm);
  };
  
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditing(true);
  };
  
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient || !user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const updatedClient = {
        name: formData.get('name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
      };
      
      const { error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', editingClient.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Atualizar o cliente na lista local
      setClients(prev => prev.map(client => 
        client.id === editingClient.id 
          ? { ...client, ...updatedClient }
          : client
      ));
      
      setIsEditing(false);
      setEditingClient(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar cliente');
      console.error('Erro ao atualizar cliente:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (clientId: string) => {
    if (!user || !window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Remover o cliente da lista local
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente. Tente novamente.');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link to="/clients/new" className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-1" />
          Novo Cliente
        </Link>
      </div>
      
      <div className="relative">
        <div className="flex">
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            className="input pr-10 flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="btn btn-primary ml-2"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-400">Carregando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-lg">
          <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">Nenhum cliente encontrado</h3>
          <p className="text-gray-400 mt-2">
            {searchTerm 
              ? 'Nenhum cliente corresponde à sua busca' 
              : 'Comece adicionando seu primeiro cliente'}
          </p>
          <Link to="/clients/new" className="btn btn-primary mt-4 inline-flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Adicionar Cliente
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-700 transition-colors">
                  {isEditing && editingClient?.id === client.id ? (
                    <td colSpan={4} className="px-6 py-4">
                      <form onSubmit={handleSave} className="space-y-4">
                        {error && (
                          <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="name" className="label">Nome *</label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              required
                              defaultValue={editingClient.name}
                              className="input"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="label">Email</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              defaultValue={editingClient.email || ''}
                              className="input"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="label">Telefone</label>
                            <input
                              type="text"
                              id="phone"
                              name="phone"
                              defaultValue={editingClient.phone || ''}
                              className="input"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setEditingClient(null);
                              setError(null);
                            }}
                            className="btn btn-outline"
                            disabled={isSaving}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <span className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Salvando...
                              </span>
                            ) : (
                              'Salvar'
                            )}
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{client.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{client.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 ml-2"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;