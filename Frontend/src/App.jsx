import { lazy, Suspense } from 'react';
import { Loading } from './components/Common';
import { Route, Routes, Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Container, Typography } from '@mui/material';
import Layout from './components/Layout';
import Catalog from './pages/Catalog';
const Auth = lazy(() => import('./pages/Auth'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
import { useText } from './i18n/LanguageProvider';
function RequireAuth({ children }) { const auth = useSelector(s => s.auth); const location = useLocation(); return auth.token ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />; }
function NotFound() { const t = useText(); return <Container sx={{ py: 8 }}><Typography variant="h4">{t('notFound')}</Typography><Button component={Link} to="/">{t('backCatalog')}</Button></Container>; }
export default function App() {
  return <Suspense fallback={<Loading />}><Routes><Route element={<Layout />}><Route index element={<Catalog />} /><Route path="login" element={<Auth key="login" mode="login" />} /><Route path="register" element={<Auth key="register" mode="register" />} /><Route path="cart" element={<Cart />} /><Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} /><Route path="*" element={<NotFound />} /></Route></Routes></Suspense>;
}
