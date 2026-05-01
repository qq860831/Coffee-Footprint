import React, { useState } from 'react';
import { TAIWAN_CITIES, TAIWAN_DISTRICTS } from '../lib/taiwanData';
import { CoffeeShop, CoffeeShopStatus } from '../types';
import { Star, CheckCircle2, CalendarHeart } from 'lucide-react';

interface AddCafeFormProps {
  initialData?: CoffeeShop;
  onSave: (shop: Omit<CoffeeShop, 'id' | 'createdAt'>, id?: string) => void;
  onClose: () => void;
}

const COMMON_TAGS = ["手沖", "安靜", "有插座", "不限時", "甜點好吃", "老宅", "寵物友善", "深夜"];

export function AddCafeForm({ initialData, onSave, onClose }: AddCafeFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [city, setCity] = useState(initialData?.city || TAIWAN_CITIES[0]);
  const [district, setDistrict] = useState(initialData?.district || TAIWAN_DISTRICTS[TAIWAN_CITIES[0]][0]);
  const [status, setStatus] = useState<CoffeeShopStatus>(initialData?.status || 'visited');
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [highlights, setHighlights] = useState(initialData?.highlights || '');

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value as any;
    setCity(newCity);
    setDistrict(TAIWAN_DISTRICTS[newCity][0] || '');
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleCustomTagAuth = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      if (!tags.includes(customTag.trim())) {
        setTags([...tags, customTag.trim()]);
      }
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      city,
      district,
      rating: status === 'visited' ? rating : 0,
      tags,
      highlights: highlights.trim(),
      status
    }, initialData?.id);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 analog-border analog-shadow space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-serif font-bold text-coffee-dark tracking-tight">
          {initialData ? '編輯紀錄' : '留下記錄'}
        </h2>
        <button type="button" onClick={onClose} className="text-coffee-light hover:text-coffee-dark cursor-pointer transition-colors p-1">
          ✕
        </button>
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">店名</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="如：沛洛瑟珈琲店"
          required
          className="p-3 bg-warm-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark font-serif text-lg analog-shadow"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">縣市</label>
          <select 
            value={city} 
            onChange={handleCityChange}
            className="p-3 bg-warm-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark analog-shadow"
          >
            {TAIWAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">區域</label>
          <select 
            value={district} 
            onChange={(e) => setDistrict(e.target.value)}
            className="p-3 bg-warm-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark analog-shadow"
          >
            {(TAIWAN_DISTRICTS[city] || []).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="flex space-x-6 justify-center pt-2">
        <label className={`flex items-center justify-center cursor-pointer p-4 rounded-full transition-all border ${status === 'visited' ? 'bg-coffee-dark border-coffee-dark text-warm-white shadow-md transform scale-110' : 'bg-warm-white border-sand text-coffee-light hover:bg-white hover:scale-105'}`} title="已拜訪">
          <input 
            type="radio" 
            name="status"
            checked={status === 'visited'} 
            onChange={() => setStatus('visited')}
            className="hidden"
          />
          <CheckCircle2 className="w-6 h-6" />
        </label>
        <label className={`flex items-center justify-center cursor-pointer p-4 rounded-full transition-all border ${status === 'want_to_go' ? 'bg-[#F2ECE4] border-coffee-medium text-coffee-dark shadow-md transform scale-110' : 'bg-warm-white border-sand text-coffee-light hover:bg-white hover:scale-105'}`} title="待收藏">
          <input 
            type="radio" 
            name="status"
            checked={status === 'want_to_go'} 
            onChange={() => setStatus('want_to_go')}
            className="hidden"
          />
          <CalendarHeart className="w-6 h-6" />
        </label>
      </div>

      {status === 'visited' && (
        <div className="flex flex-col space-y-2 items-center">
          <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">星級評分</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-colors cursor-pointer"
              >
                <Star 
                  className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'fill-amber-500 text-amber-500' : 'text-sand'} transition-all`} 
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">標籤 (可複選或手寫)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COMMON_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full border text-xs italic transition-all cursor-pointer ${
                tags.includes(tag) 
                  ? 'bg-coffee-dark text-warm-white border-coffee-dark shadow-sm' 
                  : 'bg-warm-white text-coffee-light border-sand hover:border-coffee-light hover:bg-white'
              }`}
            >
              #{tag}
            </button>
          ))}
          {tags.filter(t => !COMMON_TAGS.includes(t)).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="px-3 py-1 rounded-full border text-xs italic transition-all bg-coffee-dark text-warm-white border-coffee-dark shadow-sm cursor-pointer"
            >
              #{tag} ✕
            </button>
          ))}
        </div>
        <input 
          type="text" 
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={handleCustomTagAuth}
          placeholder="輸入自訂標籤後按 Enter"
          className="p-3 bg-warm-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark text-sm placeholder:italic analog-shadow"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-xs uppercase tracking-wider text-coffee-light font-bold">心得亮點</label>
        <textarea 
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          placeholder="這裡的配方豆帶有明顯的果香，是很安靜的角落..."
          rows={3}
          className="p-3 bg-warm-white border border-sand rounded-xl focus:outline-none focus:border-coffee-light text-coffee-dark italic analog-shadow"
        />
      </div>

      <button 
        type="submit" 
        className="w-full py-4 bg-coffee-dark text-white rounded-xl font-bold tracking-widest hover:bg-coffee-medium transition-colors cursor-pointer shadow-md"
      >
        收藏足跡
      </button>
    </form>
  );
}
