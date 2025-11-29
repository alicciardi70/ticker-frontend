import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// existing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Devices from "./pages/Devices";
import DeviceTeams from "./pages/DeviceTeams";
import ProductDetail from "./pages/ProductDetail"; // if you have it
import Checkout from "./pages/Checkout";           // if you added it
import OrderPage from "./pages/Order";             // if you added it
import Account from "./pages/Account";
import Orders from "./pages/Orders";
// New Pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Products from "./pages/Products";
import DeviceConfig from "./pages/DeviceConfig";


export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Everything below shares the same top nav */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          
          <Route path="/products" element={<Products />} /> 

          <Route path="/devices" element={<Devices />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
          <Route path="/devices/:deviceId/config" element={<DeviceConfig />} />
          <Route path="/products/:id" element={<ProductDetail />} /> 
          
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderPage />} />

	  {/* --- NEW PASSWORD RESET ROUTES --- */}
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
          {/* --------------------------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/devices/:deviceId/teams" element={<DeviceTeams />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}