import { configureStore, createSlice } from '@reduxjs/toolkit';
const emptyAuth = { token: null, user: null, expiresAt: null };
const authSlice = createSlice({
  name: 'auth', initialState: emptyAuth,
  reducers: { setAuth: (_, action) => action.payload, logout: () => emptyAuth },
});
export const { setAuth, logout } = authSlice.actions;
const cartSlice = createSlice({
  name: 'cart', initialState: { items: [] },
  reducers: {
    addItem(state, { payload: product }) {
      const item = state.items.find(i => i.product.id === product.id);
      if (item) item.quantity = Math.min(99, item.quantity + 1);
      else state.items.push({ product, quantity: 1 });
    },
    setQuantity(state, { payload: { id, quantity } }) {
      const item = state.items.find(i => i.product.id === id);
      if (item && Number.isInteger(quantity)) item.quantity = Math.max(1, Math.min(99, quantity));
    },
    removeItem(state, { payload: id }) { state.items = state.items.filter(i => i.product.id !== id); },
    clearCart(state) { state.items = []; },
  },
  extraReducers: builder => builder.addCase(logout, state => { state.items = []; }),
});
export const { addItem, setQuantity, removeItem, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export const makeStore = () => configureStore({ reducer: { auth: authSlice.reducer, cart: cartReducer } });
export const store = makeStore();
// JWT stays in memory. Reloading the page intentionally requires login again.
