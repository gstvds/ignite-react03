import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { CART_STORAGE_KEY } from '../util/constants';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

type ProductWithoutAmount = Omit<Product, 'amount'>;

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const getStock = await api.get<Stock>(`/stock/${productId}`);
      const { amount } = getStock.data;
      if (amount <= 1) throw new Error('Out of stock');

      let checkItemExists = cart.find((item) => item.id === productId);
      let updateCart: Product[] = [];

      if (!checkItemExists) {
        const { data: productData } = await api.get<ProductWithoutAmount>(`/products/${productId}`);
        checkItemExists = { ...productData, amount: 1 };

        updateCart = [...cart, checkItemExists];
      } else {
        updateCart = cart.map((item) => {
          if (item.id === productId) return { ...item, amount: item.amount + 1 }
          return item;
        });
      }

      setCart(updateCart);
      await api.patch(`/stock/${productId}`, { amount: amount - 1 });
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
