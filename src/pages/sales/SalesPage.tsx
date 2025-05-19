import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ShoppingBag, CalendarIcon, CheckCircle, XCircle, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  sale_date: string;
  is_completed: boolean;
  created_at: string;
  notes: string | null;
  instagram: string | null;
  clients: {
    name: string;
  };
}

function SalesPage() {
  const { user } = useSupabase();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    fetchSales();
  }, [user, filterCompleted, startDate, endDate, searchTerm]);

  const fetchSales = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          is_completed,
          created_at,
          notes,
          instagram,
          clients (
            name
          )
        `)
        .eq('user_id', user.id);

      if (filterCompleted !== null) {
        query = query.eq('is_completed', filterCompleted);
      }

      if (startDate && endDate) {
        query = query
          .gte('sale_date', startDate)
          .lte('sale_date', endDate);
      }

      query = query.order('sale_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro na consulta do Supabase:', error);
        throw error;
      }

      let filteredSales = data || [];

      // Aplicando busca local (cliente ou instagram)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredSales = filteredSales.filter((sale) =>
          sale.clients?.name?.toLowerCase().includes(lowerSearch) ||
          sale.instagram?.toLowerCase().includes(lowerSearch)
        );
      }

      setSales(filteredSales);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompleted(null);
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendas</h1>
        <Link to="/sales/new" className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-1" />
          Nova Venda
        </Link>
      </div>

      <div className="card p-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="search" className="label">Buscar</label>
              <div className="flex">
                <input
                  id="search"
                  type="text"
                  placeholder="Buscar por cliente ou Instagram..."
                  className="input pr-10 flex-grow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-grow">
              <label className="label">Período</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="flex items-center text-gray-400">até</span>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    filterCompleted === null
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterCompleted(null)}
                >
                  Todas
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                    filterCompleted === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterCompleted(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluídas
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                    filterCompleted === false
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setFilterCompleted(false)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Pendentes
                </button>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-400">Carregando vendas...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-lg">
          <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">Nenhuma venda encontrada</h3>
          <p className="text-gray-400 mt-2">
            {searchTerm || filterCompleted !== null || startDate || endDate
              ? 'Nenhuma venda corresponde aos seus filtros'
              : 'Comece registrando sua primeira venda'}
          </p>
          <Link to="/sales/new" className="btn btn-primary mt-4 inline-flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Registrar Venda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map((sale) => (
            <Link key={sale.id} to={`/sales/${sale.id}`} className="card card-hover">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-lg">{sale.clients.name}</h3>
                  <span
                    className={`badge ${sale.is_completed ? 'badge-success' : 'badge-warning'}`}
                  >
                    {sale.is_completed ? 'Concluída' : 'Pendente'}
                  </span>
                </div>

                <div className="text-sm text-gray-400">
                  <p>Instagram: {sale.instagram || '---'}</p>
                  <p>Data da venda: {formatDate(sale.sale_date)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SalesPage;
