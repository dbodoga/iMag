import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { Box, Button, Chip, Container, Snackbar, Stack, TextField, Typography } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Add from '@mui/icons-material/Add';
import { api } from '../api/client';
import { addItem } from '../store/store';
import { useLanguage, useText } from '../i18n/LanguageProvider';
import { ErrorNotice, Loading, Money, ProductArt } from '../components/Common';
export default function Catalog() {
  const t = useText(); const { locale } = useLanguage(); const dispatch = useDispatch();
  const [category, setCategory] = useState(0); const [search, setSearch] = useState(''); const [notice, setNotice] = useState(false);
  const products = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
  const visible = products.data?.filter(p => (!category || p.categoryId === category) && p.name.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))) || [];
  return <Container maxWidth="lg">
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow">{t('eyebrow')}</div><Typography component="h1" className="hero-title">{t('heroTitle')}</Typography><Typography className="hero-description">{t('heroText')}</Typography>
        <Button variant="contained" size="large" endIcon={<ArrowForward />} href="#collection">{t('explore')}</Button><Typography variant="caption" className="demo-note">{t('demo')}</Typography>
      </div>
      <div className="hero-feature"><div className="eyebrow">{t('featured')}</div><ProductArt hero product={{ id: 1, categoryId: 1 }} /><div className="feature-label"><Typography variant="h5">{t('featureName')}</Typography><Typography variant="body2">{t('featureText')}</Typography></div><div className="hero-orbit" /></div>
    </section>
    <section id="collection" className="collection">
      <div className="section-heading"><div><Typography variant="h4" component="h2">{t('collection')}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{t('collectionText')}</Typography></div><TextField label={t('search')} size="small" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1,  mb: 4 }}><Chip label={t('all')} onClick={() => setCategory(0)} color={!category ? 'primary' : 'default'} />{categories.data?.map(c => <Chip key={c.id} label={locale === 'ro' ? c.name : c.nameEn} onClick={() => setCategory(c.id)} color={category === c.id ? 'primary' : 'default'} />)}</Stack>
      {categories.isError && <ErrorNotice error={categories.error} retry={categories.refetch} />}
      {products.isPending ? <Loading /> : products.isError ? <ErrorNotice error={products.error} retry={products.refetch} /> : !visible.length ? <Typography sx={{ py: 6 }}>{t('emptyCatalog')}</Typography> :
      <div className="product-grid">{visible.map(p => <Box component="article" className="product-card" key={p.id}>
        <ProductArt product={p} /><div className="product-info"><Typography className="product-category">{categories.data?.find(c => c.id === p.categoryId)?.[locale === 'ro' ? 'name' : 'nameEn']}</Typography><Typography variant="h6" component="h3">{p.name}</Typography><Typography variant="body2" color="text.secondary" className="product-description">{locale === 'ro' ? p.description : p.descriptionEn}</Typography><div className="product-bottom"><Typography sx={{ fontWeight: 700 }}><Money value={p.price} /></Typography><Button variant="outlined" size="small" startIcon={<Add />} onClick={() => { dispatch(addItem(p)); setNotice(true); }}>{t('add')}</Button></div></div>
      </Box>)}</div>}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>{t('priceNote')}</Typography>
    </section><Snackbar open={notice} autoHideDuration={2200} onClose={() => setNotice(false)} message={t('added')} />
  </Container>;
}
