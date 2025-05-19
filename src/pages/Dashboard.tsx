import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';

function Dashboard() {
  const { user } = useSupabase();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSales: 0,
    completedSales: 0,
    pendingSales: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Get total clients
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (clientError) throw clientError;
        
        // Get total sales
        const { count: salesCount, error: salesError } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (salesError) throw salesError;
        
        // Get completed sales
        const { count: completedCount, error: completedError } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true);
          
        if (completedError) throw completedError;
        
        setStats({
          totalClients: clientCount || 0,
          totalSales: salesCount || 0,
          completedSales: completedCount || 0,
          pendingSales: (salesCount || 0) - (completedCount || 0),
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [user]);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    color 
  }: { 
    icon: React.ElementType; 
    title: string; 
    value: number; 
    color: string;
  }) => (
    <div className="card p-6 animate-slide-in">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold">{loading ? '...' : value}</h3>
        </div>
      </div>
    </div>
  );
  
  const ActionCard = ({ 
    icon: Icon, 
    title, 
    description, 
    to, 
    color 
  }: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    to: string; 
    color: string;
  }) => (
    <Link to={to} className="card card-hover">
      <div className="p-6">
        <div className={`p-3 rounded-full ${color} inline-block mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total de Clientes"
          value={stats.totalClients}
          color="bg-violet-600"
        />
        <StatCard
          icon={ShoppingBag}
          title="Total de Vendas"
          value={stats.totalSales}
          color="bg-teal-600"
        />
        <StatCard
          icon={CheckCircle}
          title="Vendas Concluídas"
          value={stats.completedSales}
          color="bg-green-600"
        />
        <StatCard
          icon={XCircle}
          title="Vendas Pendentes"
          value={stats.pendingSales}
          color="bg-amber-600"
        />
      </div>
      
      <h2 className="text-xl font-semibold mt-8 mb-4">Ações Rápidas</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          icon={Plus}
          title="Novo Cliente"
          description="Cadastre um novo cliente no sistema"
          to="/clients/new"
          color="bg-violet-600"
        />
        <ActionCard
          icon={Plus}
          title="Nova Venda"
          description="Registre uma nova venda com fotos"
          to="/sales/new"
          color="bg-teal-600"
        />
        <ActionCard
          icon={ShoppingBag}
          title="Gerenciar Vendas"
          description="Visualize e edite suas vendas"
          to="/sales"
          color="bg-amber-600"
        />
      </div>
    </div>
  );
}

export default Dashboard;