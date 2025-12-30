import LandingPage from "./components/LandingPage"; // Make sure this path matches where you saved it
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// existing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Devices from "./pages/Devices";
import ProductDetail from "./pages/ProductDetail"; // if you have it
import Checkout from "./pages/Checkout";           // if you added it
import OrderPage from "./pages/Order";             // if you added it
import Account from "./pages/Account";
import Orders from "./pages/Orders";
// New Pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import ChangePassword from "./pages/ChangePassword";
import WifiSetupBle from "./pages/WifiSetupBle";


export default function App() {
  return (
    <HashRouter>
      <Routes>

{/* --- 1. THE FRONT DOOR (Marketing) --- */}
        {/* This sits OUTSIDE the Layout so it can be full-screen & dark */}
        <Route 
          path="/" 
          element={
            <LandingPage 
              onLoginClick={() => window.location.hash = "#/login"} 
            />
          } 
        />


        {/* Everything below shares the same top nav */}
        <Route element={<Layout />}>
          {/*<Route path="/" element={<Home />} /> */}
          <Route path="/dashboard" element={<Home />} />
          <Route path="/products" element={<Products />} /> 

          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:deviceId/config" element={<Devices />} />
          <Route path="/wifi-setup" element={<WifiSetupBle />} />

          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
          
          <Route path="/products/:id" element={<ProductDetail />} /> 
          
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderPage />} />
	        <Route path="/change-password" element={<ChangePassword />} />
	         {/* --- NEW PASSWORD RESET ROUTES --- */}
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
          {/* --------------------------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
	        <Route path="/cart" element={<Cart />} />
          
        </Route>
      </Routes>
    </HashRouter>
  );
}