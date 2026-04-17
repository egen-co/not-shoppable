import React from 'react';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group flex flex-col border border-black bg-black p-4 transition-all hover:bg-black hover:text-white">
      <div className="aspect-square w-full overflow-hidden bg-gray-100 mb-4">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
        />
      </div>
      <p className="text-xs uppercase tracking-widest text-gray-300 group-hover:text-gray-300">{product.category}</p>
      <h3 className="text-lg font-bold leading-tight mt-1 uppercase">{product.name}</h3>
      <p className="mt-2 font-mono text-sm">{product.price}</p>
      <a 
        href={product.buy_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-4 block border border-black py-2 text-center text-xs font-bold uppercase tracking-widest transition-colors group-hover:border-white group-hover:bg-white group-hover:text-black"
      >
        Shop Now
      </a>
    </div>
  );
};