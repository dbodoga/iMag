import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { store } from './store/store';
import { queryClient } from './api/queries';
import { LanguageProvider } from './i18n/LanguageProvider';
import App from './App';
import './styles.css';
const theme = createTheme({
  palette: { primary: { main: '#265c4f' }, background: { default: '#fafaf7', paper: '#ffffff' }, text: { primary: '#182529', secondary: '#687471' } },
  typography: { fontFamily: '"Segoe UI", Arial, sans-serif', button: { textTransform: 'none', fontWeight: 600 }, h3: { fontWeight: 650 }, h4: { fontWeight: 650 }, h6: { fontWeight: 650 } },
  shape: { borderRadius: 10 },
  components: { MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 30, padding: '9px 19px' } } }, MuiChip: { styleOverrides: { root: { fontWeight: 500 } } } },
});
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Provider store={store}><QueryClientProvider client={queryClient}><LanguageProvider><ThemeProvider theme={theme}><CssBaseline /><BrowserRouter><App /></BrowserRouter></ThemeProvider></LanguageProvider></QueryClientProvider></Provider></React.StrictMode>);
