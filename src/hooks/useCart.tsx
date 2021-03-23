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
      const { data: stockData } = await api.get<Stock>(`/stock/${productId}`);
      if (stockData.amount <= 1) throw new Error('Quantidade solicitada fora de estoque');

      let checkItemExists = cart.find((item) => item.id === productId);
      let updateCart: Product[] = [];

      if (!checkItemExists) {
        const { data } = await api.get<ProductWithoutAmount>(`/products/${productId}`);
        checkItemExists = { ...data, amount: 1 };
        updateCart = [...cart, checkItemExists];

        setCart(updateCart);
      } else {
        updateCart = cart.map((item) => {
          if (item.id === productId) return { ...item, amount: item.amount + 1 }
          return item;
        });
        setCart(updateCart);
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updateCart));
    } catch (error) {
      toast.error(error.message.includes('fora de estoque') ? error.message : 'Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);
      if (!findProduct) throw new Error('Erro na remoção do produto');

      const updateCart = cart.filter((product) => product.id !== productId);

      setCart(updateCart);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updateCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error('Quantidade de produtos inválida');

      const { data: stockData } = await api.get<Stock>(`/stock/${productId}`);

      if (stockData.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updateCart = cart.map((product) => {
        if (product.id === productId) return { ...product, amount };
        return product;
      });

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updateCart));

      setCart(updateCart);
    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto');
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
