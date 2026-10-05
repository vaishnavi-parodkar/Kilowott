import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast.jsx';
import { ProductsProvider } from './hooks/ProductsContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Catalog from './pages/Catalog.jsx';
import SyncPage from './pages/SyncPage.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <ToastProvider>
      <ProductsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Catalog />} />
              <Route path="sync" element={<SyncPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProductsProvider>
    </ToastProvider>
  );
}
