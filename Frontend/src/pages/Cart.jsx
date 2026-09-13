import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Container, Divider, IconButton, Paper, Stack, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add'; import Remove from '@mui/icons-material/Remove';
import { api } from '../api/client';
import { queryClient } from '../api/queries';
import { clearCart, removeItem, setQuantity } from '../store/store';
import { useText } from '../i18n/LanguageProvider';
import { ErrorNotice, Money, ProductArt } from '../components/Common';
export default function Cart() {
  const t = useText(); const items = useSelector(s => s.cart.items); const auth = useSelector(s => s.auth); const dispatch = useDispatch(); const navigate = useNavigate();
  const pendingRequest = useRef(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = items.map(i => ({ productId: i.product.id, quantity: i.quantity }));
      const fingerprint = JSON.stringify(payload);
      if (!pendingRequest.current || pendingRequest.current.fingerprint !== fingerprint) pendingRequest.current = { fingerprint, requestId: crypto.randomUUID() };
      return (await api.post('/orders', { requestId: pendingRequest.current.requestId, items: payload })).data;
    },
    onSuccess: () => { dispatch(clearCart()); queryClient.invalidateQueries({ queryKey: ['orders', auth.user.id] }); navigate('/orders', { state: { placed: true } }); },
  });
  if (!items.length) return <Container maxWidth="lg" sx={{ py: 8 }}><Typography variant="h3" component="h1">{t('cartTitle')}</Typography><Typography sx={{ my: 3 }}>{t('emptyCart')}</Typography><Button component={Link} to="/" variant="contained">{t('backCatalog')}</Button></Container>;
  const total = items.reduce((n, i) => n + Math.round(i.product.price * 100) * i.quantity, 0) / 100;
  return <Container maxWidth="lg" sx={{ py: 6 }}><Typography variant="h3" component="h1" sx={{ mb: 5 }}>{t('cartTitle')}</Typography><div className="cart-grid">
    <Stack spacing={2}>{items.map(({ product, quantity }) => <Paper key={product.id} variant="outlined" className="cart-item"><ProductArt product={product} /><Box sx={{ flex: 1 }}><Typography variant="h6">{product.name}</Typography><Typography sx={{ my: 1 }}><Money value={product.price} /></Typography><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><IconButton aria-label={t('decrease')} disabled={quantity === 1 || mutation.isPending} onClick={() => dispatch(setQuantity({ id: product.id, quantity: quantity - 1 }))}><Remove /></IconButton><Typography aria-label={t('quantity')}>{quantity}</Typography><IconButton aria-label={t('increase')} disabled={quantity === 99 || mutation.isPending} onClick={() => dispatch(setQuantity({ id: product.id, quantity: quantity + 1 }))}><Add /></IconButton><Button color="inherit" disabled={mutation.isPending} onClick={() => dispatch(removeItem(product.id))}>{t('remove')}</Button></Stack></Box><Typography sx={{ fontWeight: 700 }}><Money value={product.price * quantity} /></Typography></Paper>)}</Stack>
    <Paper variant="outlined" sx={{ p: 3, alignSelf: 'start', borderRadius: 3 }}><Typography variant="h5">{t('summary')}</Typography><Divider sx={{ my: 3 }} /><Stack direction="row" sx={{ justifyContent: "space-between",  mb: 3 }}><Typography>{t('total')}</Typography><Typography sx={{ fontWeight: 700 }}><Money value={total} /></Typography></Stack><Alert severity="info" sx={{ mb: 3 }}>{t('checkoutNote')}</Alert>
    {mutation.isError && <Box sx={{ mb: 2 }}><ErrorNotice error={mutation.error} /></Box>}
    {auth.token ? <Button fullWidth variant="contained" size="large" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{t(mutation.isPending ? 'loading' : 'placeOrder')}</Button> : <Button fullWidth variant="contained" component={Link} to="/login" state={{ from: '/cart' }}>{t('loginToOrder')}</Button>}</Paper>
  </div></Container>;
}
