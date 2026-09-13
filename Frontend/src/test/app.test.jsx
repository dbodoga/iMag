import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { messages } from '../i18n/messages';
import { makeStore, addItem, setQuantity, setAuth, logout } from '../store/store';
import { api } from '../api/client';
vi.mock('../api/client', () => ({ api: { get: vi.fn(), post: vi.fn() }, errorCode: e => e.response?.data?.code || 'network' }));
const product = { id: 1, name: 'iPhone 17', description: 'Telefon', descriptionEn: 'Phone', price: 4799, categoryId: 1 };
function mount(path = '/', store = makeStore()) {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { store, user: userEvent.setup(), ...render(<Provider store={store}><QueryClientProvider client={query}><LanguageProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></LanguageProvider></QueryClientProvider></Provider>) };
}
beforeEach(() => { localStorage.clear(); vi.resetAllMocks(); api.get.mockImplementation(async url => ({ data: url === '/categories' ? [{ id: 1, name: 'Telefoane', nameEn: 'Phones' }] : url === '/orders' ? { items: [], totalCount: 0 } : [product] })); });
describe('iMag user flows', () => {
  it('has matching translation keys in both languages', () => { expect(Object.keys(messages.ro).sort()).toEqual(Object.keys(messages.en).sort()); });
  it('loads the catalog, switches language, searches and adds to the bag', async () => {
    const { user } = mount();
    await screen.findByRole('heading', { name: 'iPhone 17' });
    await user.click(await screen.findByRole('button', { name: 'Schimbă limba' }));
    expect(screen.getByRole('heading', { name: 'The iMag collection' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Add to bag' }));
    await user.click(await screen.findByRole('link', { name: 'Bag (1)' }));
    expect(await screen.findByRole('heading', { name: 'Your good choices.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to order' })).toBeInTheDocument();
  });
  it('validates registration and sends only a valid form', async () => {
    api.post.mockResolvedValue({ data: { token: 'test', expiresAt: new Date(Date.now() + 3600000).toISOString(), user: { id: 'user1', name: 'Ana', email: 'ana@example.test' } } });
    const { user } = mount('/register');
    await user.click(await screen.findByRole('button', { name: 'Creează cont' }));
    expect(api.post).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Nume'), 'Ana');
    await user.type(screen.getByLabelText('Email'), 'ana@example.test');
    await user.type(screen.getByLabelText('Parolă'), 'Strong-password');
    await user.click(await screen.findByRole('button', { name: 'Creează cont' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { name: 'Ana', email: 'ana@example.test', password: 'Strong-password' }));
    await screen.findByRole('button', { name: 'Ieșire' });
  });
  it('places an authenticated order and clears the bag', async () => {
    const store = makeStore();
    store.dispatch(setAuth({ token: 'test', expiresAt: new Date(Date.now() + 3600000).toISOString(), user: { id: 'user1' } }));
    store.dispatch(addItem(product));
    api.post.mockResolvedValue({ data: { id: 'order1' } });
    const { user } = mount('/cart', store);
    await user.click(await screen.findByRole('button', { name: 'Plasează comanda' }));
    await screen.findByText('Comanda a fost înregistrată cu succes.');
    expect(api.post).toHaveBeenCalledWith('/orders', { requestId: expect.any(String), items: [{ productId: 1, quantity: 1 }] });
    expect(store.getState().cart.items).toEqual([]);
  });
  it('keeps a failed checkout retry id and prevents cart quantities outside 1–99', async () => {
    const store = makeStore(); store.dispatch(setAuth({ token: 'test', user: { id: 'u' } })); store.dispatch(addItem(product));
    store.dispatch(setQuantity({ id: 1, quantity: 1000 })); expect(store.getState().cart.items[0].quantity).toBe(99);
    store.dispatch(setQuantity({ id: 1, quantity: -1 })); expect(store.getState().cart.items[0].quantity).toBe(1);
    api.post.mockRejectedValue(new Error('offline'));
    const { user } = mount('/cart', store);
    await user.click(await screen.findByRole('button', { name: 'Plasează comanda' }));
    await screen.findByText(messages.ro.network);
    await user.click(await screen.findByRole('button', { name: 'Plasează comanda' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(api.post.mock.calls[0][1].requestId).toBe(api.post.mock.calls[1][1].requestId);
    store.dispatch(logout()); expect(store.getState().cart.items).toEqual([]);
  });
  it('requires authentication for order history', async () => { mount('/orders'); expect(await screen.findByRole('heading', { name: 'Bine ai revenit.' })).toBeInTheDocument(); });
});
