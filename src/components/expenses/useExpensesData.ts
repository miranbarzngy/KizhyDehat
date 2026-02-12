import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, DateFilters, ExpenseFormData, ExpenseTab } from './types';

interface UseExpensesDataReturn {
  expenses: Expense[];
  loading: boolean;
  activeTab: ExpenseTab;
  dateFilters: DateFilters;
  formData: ExpenseFormData;
  editingExpense: Expense | null;
  showDeleteConfirm: string | null;
  showCamera: boolean;
  cameraStream: MediaStream | null;
  selectedImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setActiveTab: (tab: ExpenseTab) => void;
  setDateFilters: (filters: DateFilters) => void;
  setFormData: (data: ExpenseFormData) => void;
  setEditingExpense: (expense: Expense | null) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  setShowCamera: (show: boolean) => void;
  setSelectedImage: (image: string | null) => void;
  fetchExpenses: () => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (file: File) => Promise<void>;
  addExpense: () => Promise<void>;
  updateExpense: () => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  startEdit: (expense: Expense) => void;
  cancelEdit: () => void;
  getTotalExpenses: () => number;
}

const DEFAULT_FORM_DATA: ExpenseFormData = {
  name: '',
  unit: 'دانە',
  amount: 0,
  image: '',
  note: ''
};

export function useExpensesData(): UseExpensesDataReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExpenseTab>('all');
  const [dateFilters, setDateFilters] = useState<DateFilters>({ fromDate: '', toDate: '' });
  const [formData, setFormData] = useState<ExpenseFormData>(DEFAULT_FORM_DATA);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchExpenses = useCallback(async () => {
    if (!supabase) { setExpenses([]); setLoading(false); return; }
    try {
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (activeTab === 'filter') {
        if (dateFilters.fromDate) query = query.gte('date', dateFilters.fromDate);
        if (dateFilters.toDate) query = query.lte('date', dateFilters.toDate);
      }
      const { data, error } = await query;
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) { console.error('Error fetching expenses:', error); }
    finally { setLoading(false); }
  }, [activeTab, dateFilters]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('ناتوانرێت کامێرا بکرێتەوە');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `expense-${Date.now()}.jpg`, { type: 'image/jpeg' });
            await handleImageUpload(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!supabase) { alert('Supabase not configured'); return; }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `expenses/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('هەڵە لە ئەپلۆدکردن');
    }
  }, []);

  const addExpense = useCallback(async () => {
    if (!formData.name || formData.amount <= 0) { alert('تکایە ناو و بڕ پڕبکەرەوە'); return; }
    if (!supabase) { alert('Supabase not configured'); return; }
    try {
      const { error } = await supabase.from('expenses').insert({
        description: formData.name,
        name: formData.name,
        amount: formData.amount,
        image: formData.image,
        note: formData.note,
        date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      setFormData(DEFAULT_FORM_DATA);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchExpenses();
    } catch (error) { console.error('Error adding expense:', error); alert('هەڵە'); }
  }, [formData, fetchExpenses]);

  const updateExpense = useCallback(async () => {
    if (!editingExpense || !formData.name || formData.amount <= 0) { alert('تکایە ناو و بڕ پڕبکەرەوە'); return; }
    if (!supabase) { alert('Supabase not configured'); return; }
    try {
      const { error } = await supabase.from('expenses').update({
        name: formData.name,
        unit: formData.unit,
        amount: formData.amount,
        image: formData.image,
        note: formData.note
      }).eq('id', editingExpense.id);
      if (error) throw error;
      setEditingExpense(null);
      setFormData(DEFAULT_FORM_DATA);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchExpenses();
    } catch (error) { console.error('Error updating expense:', error); alert('هەڵە'); }
  }, [editingExpense, formData, fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!supabase) { alert('Supabase not configured'); return; }
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setShowDeleteConfirm(null);
      fetchExpenses();
    } catch (error) { console.error('Error deleting expense:', error); alert('هەڵە'); }
  }, [fetchExpenses]);

  const startEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      unit: expense.unit,
      amount: expense.amount,
      image: expense.image,
      note: expense.note
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingExpense(null);
    setFormData(DEFAULT_FORM_DATA);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const getTotalExpenses = useCallback(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return {
    expenses, loading, activeTab, dateFilters, formData, editingExpense, showDeleteConfirm, showCamera, cameraStream, selectedImage,
    fileInputRef, videoRef, canvasRef,
    setActiveTab, setDateFilters, setFormData, setEditingExpense, setShowDeleteConfirm, setShowCamera, setSelectedImage,
    fetchExpenses, startCamera, stopCamera, capturePhoto, handleFileSelect, handleImageUpload, addExpense, updateExpense, deleteExpense, startEdit, cancelEdit, getTotalExpenses
  };
}
