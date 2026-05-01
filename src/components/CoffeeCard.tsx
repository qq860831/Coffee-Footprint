import React from 'react';
import { CoffeeShop } from '../types';
import { Star, MapPin, CalendarHeart, CheckCircle2, Edit2, Trash2, Heart } from 'lucide-react';

interface CoffeeCardProps {
  shop: CoffeeShop;
  onEdit: (shop: CoffeeShop) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const CoffeeCard: React.FC<CoffeeCardProps> = ({ shop, onEdit, onDelete, onToggleFavorite }) => {
  const isVisited = shop.status === 'visited';

  return (
    <div className={`rounded-3xl p-6 analog-border analog-shadow hover:translate-y-[-2px] transition-transform duration-300 ${isVisited ? 'bg-white' : 'bg-[#F2ECE4]'} relative h-full flex flex-col`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-serif font-bold text-coffee-dark tracking-tight">
            {shop.name}
          </h3>
          <div className="flex items-center text-sm text-coffee-light mt-1">
            <MapPin className="w-4 h-4 mr-1 opacity-70" />
            <span>{shop.city} {shop.district}</span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex space-x-2">
            <button onClick={() => onToggleFavorite(shop.id)} className={`transition-colors cursor-pointer ${shop.isFavorite ? 'text-red-500' : 'text-coffee-light hover:text-red-500'}`} title={shop.isFavorite ? "取消首選" : "加入首選"}>
              <Heart className={`w-4 h-4 ${shop.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button onClick={() => onEdit(shop)} className="text-coffee-light hover:text-coffee-dark cursor-pointer transition-colors" title="編輯">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(shop.id)} className="text-coffee-light hover:text-red-500 cursor-pointer transition-colors" title="刪除">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {isVisited && (
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < shop.rating ? 'fill-current' : 'text-sand'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 pb-8">
        {shop.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {shop.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 bg-warm-white text-coffee-medium text-xs rounded-full border border-sand italic"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {shop.highlights && (
          <p className="text-sm text-coffee-medium leading-relaxed italic border-l-2 border-sand pl-3">
            "{shop.highlights}"
          </p>
        )}
      </div>

      {/* Bottom right icon */}
      <div className="absolute bottom-6 right-6">
        {isVisited ? (
          <CheckCircle2 className="w-6 h-6 text-coffee-medium opacity-80" title="已拜訪" />
        ) : (
          <CalendarHeart className="w-6 h-6 text-coffee-medium opacity-80" title="待收藏" />
        )}
      </div>
    </div>
  );
}
