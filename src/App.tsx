import React, { useState } from 'react';
import { CoffeeShop } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CoffeeCard } from './components/CoffeeCard';
import { AddCafeForm } from './components/AddCafeForm';
import { TAIWAN_CITIES } from './lib/taiwanData';
import { Plus, Coffee, Map, Search, CheckCircle2, Bookmark, Heart, Download } from 'lucide-react';

const TABS = [
  { id: 'all', label: '所有足跡', icon: Map },
  { id: 'visited', label: '已拜訪', icon: CheckCircle2 },
  { id: 'want_to_go', label: '待收藏', icon: Bookmark },
  { id: 'favorite', label: '首選清單', icon: Heart }
] as const;

export default function App() {
  const [shops, setShops] = useLocalStorage<CoffeeShop[]>('coffee-footprints', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<CoffeeShop | undefined>();
  const [shopToDelete, setShopToDelete] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string>('All');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'visited' | 'want_to_go' | 'favorite'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSaveShop = (shopData: Omit<CoffeeShop, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      setShops(prev => prev.map(s => s.id === id ? { ...s, ...shopData } : s));
    } else {
      const newShop: CoffeeShop = {
        ...shopData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        isFavorite: false,
      };
      setShops(prev => [newShop, ...prev]);
    }
  };

  const handleDeleteShop = (id: string) => {
    setShopToDelete(id);
  };

  const confirmDelete = () => {
    if (shopToDelete) {
      setShops(prev => prev.filter(s => s.id !== shopToDelete));
      setShopToDelete(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleExportExcel = () => {
    if (shops.length === 0) {
      alert("目前沒有資料可以匯出");
      return;
    }

    // CSV header
    const headers = ['店名', '縣市', '區域', '狀態', '星級', '首選', '標籤', '心得亮點', '建立日期'];
    
    // CSV rows
    const rows = shops.map(shop => {
      const statusText = shop.status === 'visited' ? '已拜訪' : '待收藏';
      const isFavoriteText = shop.isFavorite ? '是' : '否';
      const tagsText = shop.tags.join('、');
      const dateText = new Date(shop.createdAt).toLocaleDateString();
      // Handle commas and newlines in highlights/name by wrapping in quotes
      const escapeCsv = (text: string) => `"${String(text || '').replace(/"/g, '""')}"`;
      
      return [
        escapeCsv(shop.name),
        escapeCsv(shop.city),
        escapeCsv(shop.district),
        escapeCsv(statusText),
        shop.rating || 0,
        escapeCsv(isFavoriteText),
        escapeCsv(tagsText),
        escapeCsv(shop.highlights),
        escapeCsv(dateText)
      ].join(',');
    });

    // Add BOM for Excel UTF-8 compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `小咖足跡_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openFormForEdit = (shop: CoffeeShop) => {
    setEditingShop(shop);
    setIsFormOpen(true);
  };

  const uniqueCities = Array.from(new Set(shops.map(s => s.city)));
  const uniqueDistricts = filterCity === 'All' 
    ? [] 
    : Array.from(new Set(shops.filter(s => s.city === filterCity).map(s => s.district)));

  const uniqueTags = Array.from(new Set(shops.flatMap(s => s.tags))).sort();

  const filteredShops = shops.filter(shop => {
    if (activeTab === 'visited' && shop.status !== 'visited') return false;
    if (activeTab === 'want_to_go' && shop.status !== 'want_to_go') return false;
    if (activeTab === 'favorite' && !shop.isFavorite) return false;

    if (filterCity !== 'All' && shop.city !== filterCity) return false;
    if (filterDistrict !== 'All' && shop.district !== filterDistrict) return false;
    if (filterTag !== 'All' && !shop.tags.includes(filterTag)) return false;

    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-warm-white pb-20 selection:bg-coffee-light selection:text-white">
      {/* Header */}
      <header className="pt-16 pb-8 px-6 text-center">
        <h1 className="flex justify-center items-center text-5xl md:text-6xl font-serif font-black text-coffee-dark mb-4 tracking-tighter">
          <Coffee className="w-12 h-12 md:w-16 md:h-16 mr-4 shrink-0 text-coffee-dark" />
          小咖足跡
        </h1>
        <p className="text-coffee-medium italic font-serif text-lg tracking-wide opacity-80 flex items-center justify-center">
          紀錄你的每一杯好咖啡
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6">
        {/* Navigation Tabs */}
        <nav className="flex justify-center flex-wrap gap-x-4 md:gap-x-8 gap-y-4 mb-10">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={tab.label}
                className={`p-3 relative transition-all duration-300 cursor-pointer rounded-full ${
                  activeTab === tab.id 
                  ? 'bg-coffee-dark text-warm-white shadow-md transform scale-110' 
                  : 'bg-white text-coffee-light hover:bg-sand/30 hover:text-coffee-medium analog-border hover:scale-105'
                }`}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            );
          })}
        </nav>

        {/* Search & Actions section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs shrink-0">
              <input
                type="text"
                placeholder="搜尋店鋪名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark analog-shadow"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-light" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <select 
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="p-2 px-3 bg-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark text-sm analog-shadow flex-1 sm:flex-none cursor-pointer pr-8"
              >
                <option value="All">所有標籤</option>
                {uniqueTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
              </select>

              <select 
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  setFilterDistrict('All');
                }}
                className="p-2 px-3 bg-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark text-sm analog-shadow flex-1 sm:flex-none cursor-pointer pr-8"
              >
                <option value="All">所有縣市</option>
                {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              
              <select 
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="p-2 px-3 bg-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark text-sm analog-shadow flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pr-8"
                disabled={filterCity === 'All' || uniqueDistricts.length === 0}
              >
                <option value="All">所有區域</option>
                {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button 
              onClick={handleExportExcel}
              className="flex items-center px-4 py-2 bg-white text-coffee-dark border border-coffee-dark rounded-full hover:bg-sand/20 transition-colors font-bold tracking-wider cursor-pointer shadow-sm"
              title="匯出資料 (Excel/CSV)"
            >
              <Download className="w-4 h-4 mr-1" /> 匯出
            </button>
            <button 
              onClick={() => {
                setEditingShop(undefined);
                setIsFormOpen(true);
              }}
              className="flex items-center px-6 py-2 bg-coffee-dark text-warm-white rounded-full hover:bg-coffee-medium transition-colors font-bold tracking-wider cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> 新增紀錄
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredShops.length === 0 && (
          <div className="text-center py-20">
            <Map className="w-16 h-16 mx-auto text-sand mb-4" />
            <h3 className="text-xl font-serif text-coffee-medium mb-2">尚未留下足跡</h3>
            <p className="text-sm text-coffee-light mb-6">開始記錄你的第一間咖啡廳吧</p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="md:hidden inline-flex items-center px-6 py-3 bg-coffee-dark text-warm-white rounded-full hover:bg-coffee-medium transition-colors font-bold tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> 開始記錄
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => (
            <CoffeeCard 
              key={shop.id} 
              shop={shop} 
              onEdit={openFormForEdit}
              onDelete={handleDeleteShop}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => {
          setEditingShop(undefined);
          setIsFormOpen(true);
        }}
        className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-coffee-dark text-warm-white rounded-full shadow-lg flex items-center justify-center hover:bg-coffee-medium transition-transform active:scale-95 cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-coffee-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-200">
            <AddCafeForm 
              initialData={editingShop}
              onSave={handleSaveShop} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingShop(undefined);
              }} 
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 bg-coffee-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full analog-border analog-shadow animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-serif font-bold text-coffee-dark mb-4 tracking-tight">刪除紀錄？</h3>
            <p className="text-coffee-medium mb-8">確定要刪除這筆咖啡廳紀錄嗎？此動作無法復原。</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShopToDelete(null)}
                className="px-5 py-2 rounded-xl text-coffee-medium hover:bg-sand/30 font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-500 text-white font-bold tracking-wider hover:bg-red-600 transition-colors cursor-pointer"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
