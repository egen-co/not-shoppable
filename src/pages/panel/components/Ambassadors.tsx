import { Fragment, useState } from "react";

import { classes } from "../../../utils/classes";
import { useProducts } from "../../../hooks/useProducts";
import { ProductCard } from "../../../components/ProductCard";

import Overlay from "./Overlay";

const PRODUCT_DATA_URL = "./products.json";

export default function Ambassadors() {
  const { products, loading } = useProducts(PRODUCT_DATA_URL);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  if (loading) return null;

  return (
    <main className="relative flex max-h-full flex-wrap justify-center gap-4 overflow-x-hidden overflow-y-auto bg-black px-2 pt-16 pb-4 md:px-4">
      <div className="absolute inset-x-0 top-0 h-12 w-screen bg-white" />

      {products.map((product) => (
        <Fragment key={product.id}>
          <Overlay
            show={activeProductId === String(product.id)}
            onClose={() => setActiveProductId(null)}
          >
            <div className="max-w-[90vw]">
              <ProductCard product={product} />
            </div>
          </Overlay>

          <button
            onClick={() => setActiveProductId(String(product.id))}
            className={classes(
              "group relative flex w-32 flex-col items-center gap-2 border border-white bg-black p-2 transition-all hover:bg-white md:w-48",
            )}
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-900">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover grayscale group-hover:grayscale-0"
              />
            </div>
            <span className="text-center text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-black">
              {product.name}
            </span>
          </button>
        </Fragment>
      ))}
    </main>
  );
}
