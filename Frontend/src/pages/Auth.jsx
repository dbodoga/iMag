import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { api } from '../api/client';
import { setAuth } from '../store/store';
import { useText, useLanguage } from '../i18n/LanguageProvider';
import { ErrorNotice } from '../components/Common';
export default function Auth({ mode }) {
  const t = useText(); const { locale } = useLanguage(); const registerMode = mode === 'register';
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation(); const token = useSelector(s => s.auth.token);
  const target = location.state?.from === '/cart' ? '/cart' : '/';
  const schema = useMemo(() => yup.object({
    ...(registerMode ? { name: yup.string().trim().min(2, 'shortName').max(100, 'longName').required('required') } : {}),
    email: yup.string().trim().email('invalidEmail').max(254, 'longEmail').required('required'),
    password: yup.string().required('required').max(128, 'passwordLength').min(registerMode ? 10 : 1, 'passwordLength'),
  }), [registerMode]);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const mutation = useMutation({ mutationFn: async data => (await api.post(`/auth/${mode}`, data)).data, onSuccess: data => { dispatch(setAuth(data)); navigate(target, { replace: true }); } });
  if (token) return <Navigate to={target} replace />;
  return <Container maxWidth="sm" sx={{ py: { xs: 5, md: 9 } }}><Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
    <div className="eyebrow">iMag / {t(registerMode ? 'register' : 'login')}</div><Typography variant="h4" component="h1" sx={{ mt: 2, mb: 2 }}>{t(registerMode ? 'join' : 'welcome')}</Typography><Typography color="text.secondary" sx={{ mb: 4 }}>{t(registerMode ? 'registerText' : 'loginText')}</Typography>
    <Box component="form" noValidate onSubmit={handleSubmit(data => mutation.mutate(data))}><Stack spacing={2.5}>
      {mutation.isError && <ErrorNotice error={mutation.error} />}
      {registerMode && <TextField label={t('name')} autoComplete="name" {...register('name')} error={!!errors.name} helperText={errors.name ? t(errors.name.message) : ' '} />}
      <TextField label={t('email')} type="email" autoComplete="username" {...register('email')} error={!!errors.email} helperText={errors.email ? t(errors.email.message) : ' '} />
      <TextField label={t('password')} type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} {...register('password')} error={!!errors.password} helperText={errors.password ? t(errors.password.message) : registerMode ? t('passwordHint') : ' '} />
      <Button size="large" variant="contained" type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'loading' : registerMode ? 'register' : 'login')}</Button>
    </Stack></Box><Typography sx={{ mt: 3 }} variant="body2">{t(registerMode ? 'haveAccount' : 'needAccount')} <Button component={Link} state={{ from: target }} to={registerMode ? '/login' : '/register'}>{t(registerMode ? 'login' : 'register')}</Button></Typography>
  </Paper></Container>;
}
