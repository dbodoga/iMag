import { useEffect } from 'react';
import { AppBar, Badge, Box, Button, Container, Stack, Typography } from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/store';
import { useLanguage, useText } from '../i18n/LanguageProvider';
import { queryClient } from '../api/queries';
export default function Layout() {
  const t = useText(); const { locale, setLocale } = useLanguage(); const dispatch = useDispatch();
  const auth = useSelector(s => s.auth); const count = useSelector(s => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const signOut = () => { dispatch(logout()); queryClient.removeQueries({ queryKey: ['orders'] }); };
  useEffect(() => {
    if (!auth.expiresAt) return;
    const timer = setTimeout(() => { dispatch(logout()); queryClient.removeQueries({ queryKey: ['orders'] }); }, Math.max(0, Date.parse(auth.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [auth.expiresAt, dispatch]);
  return <Box className="app-shell">
    <AppBar position="static" elevation={0} color="transparent" component="header">
      <Container maxWidth="lg"><div className="navigation">
        <Typography component={Link} to="/" className="wordmark" aria-label={t('home')}>iMag<span>.</span></Typography>
        <Stack component="nav" direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label={t('catalog')}>
          <Button component={NavLink} to="/">{t('catalog')}</Button>
          {auth.token && <Button component={NavLink} to="/orders">{t('orders')}</Button>}
        </Stack>
        <Stack direction="row" spacing={1} className="nav-actions" sx={{ alignItems: "center" }}>
          <Button aria-label={t('language')} onClick={() => setLocale(locale === 'ro' ? 'en' : 'ro')} size="small">{locale === 'ro' ? 'EN' : 'RO'}</Button>
          {auth.token ? <Button onClick={signOut}>{t('logout')}</Button> : <Button component={Link} to="/login">{t('login')}</Button>}
          <Button component={Link} to="/cart" aria-label={`${t('cart')} (${count})`}><Badge badgeContent={count} color="primary"><ShoppingBagOutlined /></Badge></Button>
        </Stack>
      </div></Container>
    </AppBar>
    <Box component="main" sx={{ flex: 1 }}><Outlet /></Box>
    <Container component="footer" maxWidth="lg" className="footer">
      <div><Typography className="wordmark" component="p">iMag<span>.</span></Typography><Typography variant="body2" color="text.secondary">{t('footer')}</Typography></div>
      <Typography variant="caption" color="text.secondary">{t('footerNote')}</Typography>
    </Container>
  </Box>;
}
