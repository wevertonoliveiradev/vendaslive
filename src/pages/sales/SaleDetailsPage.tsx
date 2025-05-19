import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, Camera, CheckCircle, XCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleForm {
  saleDate: string;
  instagram: string;
  notes: string;
  isCompleted: boolean;
}

interface SalePhoto {
  id: string;
  storage_path: string;
  url?: string;
}

interface Sale {
  id: string;
  sale_date: string;
  instagram: string | null;
  notes: string | null;
  is_completed: boolean;
  client: {
    id: string;
    name: string;
  };
  photos: SalePhoto[];
}

function SaleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabase();
  const navigate = useNavigate();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagesPreviews, setNewImagesPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm<SaleForm>();
  
  const isCompleted = watch('isCompleted');
  
  useEffect(() => {
    if (!user || !id) return;
    
    fetchSale();
  }, [user, id]);
  
  const fetchSale = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    
    try {
      // Get sale data
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          instagram,
          notes,
          is_completed,
          client_id,
          clients (
            id,
            name
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (saleError) throw saleError;
      
      // Get photos
      const { data: photoData, error: photoError } = await supabase
        .from('sale_photos')
        .select('id, storage_path')
        .eq('sale_id', id)
        .eq('user_id', user.id);
        
      if (photoError) throw photoError;
      
      // Get photo URLs
      const photosWithUrls = await Promise.all(
        (photoData || []).map(async (photo) => {
          const { data } = await supabase.storage
            .from('sale_photos')
            .createSignedUrl(photo.storage_path, 3600);
            
          return {
            ...photo,
            url: data?.signedUrl
          };
        })
      );
      
      const formattedSale = {
        ...saleData,
        client: saleData.clients,
        photos: photosWithUrls
      };
      
      setSale(formattedSale);
      
      // Set form values
      setValue('saleDate', saleData.sale_date);
      setValue('instagram', saleData.instagram || '');
      setValue('notes', saleData.notes || '');
      setValue('isCompleted', saleData.is_completed);
      
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      setError('Erro ao carregar os dados da venda.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const fileList = Array.from(e.target.files);
    
    // Create previews
    const newImages = fileList.map(file => URL.createObjectURL(file));
    
    setNewImages(prev => [...prev, ...fileList]);
    setNewImagesPreviews(prev => [...prev, ...newImages]);
  };
  
  const removeNewImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newImagesPreviews[index]);
    
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDeletePhoto = async (photoId: string, storagePath: string) => {
    if (!user || !id) return;
    
    try {
      // Delete from storage
      await supabase.storage
        .from('sale_photos')
        .remove([storagePath]);
      
      // Delete record
      await supabase
        .from('sale_photos')
        .delete()
        .eq('id', photoId);
        
      // Update UI
      setSale(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          photos: prev.photos.filter(photo => photo.id !== photoId)
        };
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError('Erro ao excluir a foto.');
    }
  };
  
  const onSubmit = async (data: SaleForm) => {
    if (!user || !id || !sale) return;
    
    setSaving(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Update sale
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          sale_date: data.saleDate,
          instagram: data.instagram || null,
          notes: data.notes || null,
          is_completed: data.isCompleted,
        })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (updateError) throw updateError;
      
      // Upload new images if any
      if (newImages.length > 0) {
        const totalImages = newImages.length;
        let uploadedImages = 0;
        
        for (const file of newImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${user.id}/${id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('sale_photos')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Create sale_photo record
          const { error: photoRecordError } = await supabase
            .from('sale_photos')
            .insert([
              {
                sale_id: id,
                storage_path: filePath,
                user_id: user.id,
              },
            ]);
            
          if (photoRecordError) throw photoRecordError;
          
          uploadedImages++;
          setUploadProgress(Math.round((uploadedImages / totalImages) * 100));
        }
      }
      
      // Clear new images
      newImagesPreviews.forEach(url => URL.revokeObjectURL(url));
      setNewImages([]);
      setNewImagesPreviews([]);
      
      // Exit edit mode and refresh
      setIsEditing(false);
      await fetchSale();
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao atualizar a venda.');
      console.error('Error updating sale:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteSale = async () => {
    if (!user || !id || !sale) return;
    
    if (!window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setDeleting(true);
    
    try {
      // Delete all photos from storage
      for (const photo of sale.photos) {
        await supabase.storage
          .from('sale_photos')
          .remove([photo.storage_path]);
      }
      
      // The database cascade delete will handle the rest
      await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      navigate('/sales');
    } catch (error) {
      console.error('Error deleting sale:', error);
      setError('Erro ao excluir a venda.');
      setDeleting(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateStr;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
        <p className="ml-3 text-gray-400">Carregando venda...</p>
      </div>
    );
  }
  
  if (!sale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/sales')}
            className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold">Detalhes da Venda</h1>
        </div>
        
        <div className="card p-6 text-center">
          <p className="text-gray-400">Venda não encontrada ou você não tem permissão para visualizá-la.</p>
          <button
            onClick={() => navigate('/sales')}
            className="btn btn-primary mt-4"
          >
            Voltar para Vendas
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/sales')}
            className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold">Detalhes da Venda</h1>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-outline flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </button>
              <button
                onClick={handleDeleteSale}
                className="btn btn-danger flex items-center"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                // Revoke any preview URLs
                newImagesPreviews.forEach(url => URL.revokeObjectURL(url));
                setNewImages([]);
                setNewImagesPreviews([]);
                
                // Reset form
                setValue('saleDate', sale.sale_date);
                setValue('instagram', sale.instagram || '');
                setValue('notes', sale.notes || '');
                setValue('isCompleted', sale.is_completed);
              }}
              className="btn btn-outline"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="card p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label className="label">Cliente</label>
              <div className="p-2 bg-gray-700 rounded text-gray-200">
                {sale.client.name}
              </div>
              <p className="text-xs text-gray-400 mt-1">O cliente não pode ser alterado</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="saleDate" className="label">Data da Venda *</label>
              <input
                id="saleDate"
                type="date"
                className={`input ${errors.saleDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                {...register('saleDate', { required: 'Data é obrigatória' })}
              />
              {errors.saleDate && <p className="error-text">{errors.saleDate.message}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="instagram" className="label">Instagram</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  @
                </span>
                <input
                  id="instagram"
                  type="text"
                  className="input pl-7"
                  placeholder="nome_do_cliente"
                  {...register('instagram')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="label">Status</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isCompleted"
                  className="h-5 w-5 rounded border-gray-600 text-violet-600 focus:ring-violet-500 bg-gray-700"
                  {...register('isCompleted')}
                />
                <label htmlFor="isCompleted" className="text-sm font-medium text-gray-300">
                  Marcar como concluída
                </label>
                
                <div className={`ml-2 badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                  {isCompleted ? 'Concluída' : 'Pendente'}
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="label">Fotos Existentes</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                {sale.photos.length === 0 ? (
                  <p className="text-sm text-gray-400 col-span-full">Nenhuma foto disponível</p>
                ) : (
                  sale.photos.map((photo) => (
                    <div key={photo.id} className="relative bg-gray-700 rounded-md overflow-hidden group aspect-square">
                      {photo.url ? (
                        <img 
                          src={photo.url} 
                          alt="Foto da venda" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                        className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label className="label">Adicionar Novas Fotos</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 mt-2">
                <div className="flex flex-wrap gap-4 mb-4">
                  {newImagesPreviews.map((src, index) => (
                    <div key={index} className="relative h-24 w-24 bg-gray-700 rounded-md overflow-hidden">
                      <img 
                        src={src} 
                        alt={`Preview ${index}`} 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-gray-900 bg-opacity-70 rounded-full p-1"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="flex flex-col items-center justify-center h-24 w-24 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-xs text-gray-400">Adicionar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes" className="label">Anotações</label>
              <textarea
                id="notes"
                rows={4}
                className="input"
                placeholder="Anotações adicionais sobre a venda..."
                {...register('notes')}
              ></textarea>
            </div>
            
            {saving && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Enviando fotos...</span>
                  <span className="text-sm text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-violet-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Informações da Venda</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Cliente</p>
                    <p className="text-lg font-medium">{sale.client.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Data da Venda</p>
                    <p>{formatDate(sale.sale_date)}</p>
                  </div>
                  
                  {sale.instagram && (
                    <div>
                      <p className="text-sm text-gray-400">Instagram</p>
                      <p className="flex items-center">
                        <span className="text-violet-400 mr-1">@</span>
                        {sale.instagram}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <div className="flex items-center mt-1">
                      {sale.is_completed ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <p className="badge badge-success">Concluída</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-amber-500 mr-2" />
                          <p className="badge badge-warning">Pendente</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Anotações</h2>
                {sale.notes ? (
                  <p className="text-gray-300 whitespace-pre-line">{sale.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">Nenhuma anotação</p>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Fotos</h2>
              
              {sale.photos.length === 0 ? (
                <div className="text-center py-8 bg-gray-800 rounded-lg">
                  <Camera className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma foto disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sale.photos.map((photo) => (
                    <div key={photo.id} className="aspect-square bg-gray-700 rounded-md overflow-hidden">
                      {photo.url ? (
                        <a href={photo.url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={photo.url} 
                            alt="Foto da venda" 
                            className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SaleDetailsPage;