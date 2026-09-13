import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Alert, Button, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { api } from '../api/client';
import { useText } from '../i18n/LanguageProvider';
import { ErrorNotice, Loading, Money } from '../components/Common';
export default function Orders() {
  const t = useText(); const intl = useIntl(); const user = useSelector(s => s.auth.user); const [page, setPage] = useState(1); const location = useLocation();
  const query = useQuery({ queryKey: ['orders', user.id, page], queryFn: async () => (await api.get('/orders', { params: { page, pageSize: 10 } })).data });
  const pages = Math.max(1, Math.ceil((query.data?.totalCount || 0) / 10));
  return <Container maxWidth="md" sx={{ py: 6 }}><Typography component="h1" variant="h3" sx={{ mb: 4 }}>{t('ordersTitle')}</Typography>
    {location.state?.placed && <Alert severity="success" sx={{ mb: 3 }}>{t('orderSuccess')}</Alert>}
    {query.isPending ? <Loading /> : query.isError ? <ErrorNotice error={query.error} retry={query.refetch} /> : !query.data.items.length ? <><Typography sx={{ mb: 3 }}>{t('emptyOrders')}</Typography><Button component={Link} to="/">{t('backCatalog')}</Button></> :
    <Stack spacing={3}>{query.data.items.map(order => <Paper key={order.id} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}><div><Typography sx={{ fontWeight: 700 }}>{t('order')} #{order.id.slice(0, 8)}</Typography><Typography variant="caption" color="text.secondary">{intl.formatDate(order.orderedAt, { dateStyle: 'long', timeStyle: 'short' })}</Typography></div><Chip label={t('confirmed')} color="success" size="small" /></Stack><Divider sx={{ my: 2 }} />
      {order.items.map(item => <Stack key={item.productId} direction="row" sx={{ justifyContent: "space-between", gap: 2,  py: 1 }}><Typography>{item.productName} × {item.quantity}</Typography><Typography><Money value={item.lineTotal} /></Typography></Stack>)}<Divider sx={{ my: 2 }} /><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography sx={{ fontWeight: 700 }}>{t('total')}</Typography><Typography sx={{ fontWeight: 700 }}><Money value={order.total} /></Typography></Stack>
    </Paper>)}</Stack>}
    {pages > 1 && <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "center",  mt: 4 }}><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t('previous')}</Button><Typography>{t('page', { page, pages })}</Typography><Button disabled={page === pages} onClick={() => setPage(p => p + 1)}>{t('next')}</Button></Stack>}
  </Container>;
}
