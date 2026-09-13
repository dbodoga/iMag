import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { useText } from '../i18n/LanguageProvider';
import { errorCode } from '../api/client';
export function Money({ value }) { const intl = useIntl(); return intl.formatNumber(value, { style: 'currency', currency: 'RON' }); }
export function Loading() { const t = useText(); return <Box role="status" sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={28} /><Typography sx={{ mt: 2 }}>{t('loading')}</Typography></Box>; }
export function ErrorNotice({ error, retry }) { const t = useText(); return <Alert severity="error" action={retry && <Button color="inherit" onClick={retry}>{t('retry')}</Button>}>{t(errorCode(error))}</Alert>; }
export function ProductArt({ product, hero = false }) {
  const kind = product.categoryId === 1 ? 'phone' : product.categoryId === 2 ? 'laptop' : product.id === 5 ? 'earbuds' : 'mouse';
  return <div className={`product-art ${hero ? 'hero-art' : ''} art-${product.id}`} aria-hidden="true"><div className={`device ${kind}`}><i /><b /><span /></div></div>;
}
