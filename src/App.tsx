import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import { Login } from './pages/Login';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProductForm } from './pages/AdminProductForm';
import { InfoPage } from './pages/InfoPage';

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmation" element={<OrderConfirmation />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/dashboard/products/new" element={<AdminProductForm />} />
            <Route path="/admin/dashboard/products/:id" element={<AdminProductForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MaintenanceGuard>
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
