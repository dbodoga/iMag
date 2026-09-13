import { createContext, useContext, useEffect, useState } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { messages } from './messages';
const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);
export const useText = () => { const intl = useIntl(); return (id, values) => intl.formatMessage({ id }, values); };
export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => { try { return localStorage.getItem('imag-language') === 'en' ? 'en' : 'ro'; } catch { return 'ro'; } });
  useEffect(() => { document.documentElement.lang = locale; try { localStorage.setItem('imag-language', locale); } catch { /* Language still works without storage. */ } }, [locale]);
  return <LanguageContext.Provider value={{ locale, setLocale }}><IntlProvider locale={locale} messages={messages[locale]}>{children}</IntlProvider></LanguageContext.Provider>;
}
