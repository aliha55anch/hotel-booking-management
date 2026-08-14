import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import OwnerLayout from "./components/owner/OwnerLayout.jsx";
import AdminOverview from "./pages/admin/Overview.jsx";
import ManageHotels from "./pages/admin/ManageHotels.jsx";
import ManageRooms from "./pages/admin/ManageRooms.jsx";
import ManageBookings from "./pages/admin/ManageBookings.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageOffers from "./pages/admin/ManageOffers.jsx";
import OwnerOverview from "./pages/owner/Overview.jsx";
import OwnerHotels from "./pages/owner/MyHotels.jsx";
import OwnerRooms from "./pages/owner/MyRooms.jsx";
import OwnerBookings from "./pages/owner/Bookings.jsx";
import Home from "./pages/Home.jsx";
import Hotels from "./pages/Hotels.jsx";
import HotelDetail from "./pages/HotelDetail.jsx";
import Experience from "./pages/Experience.jsx";
import OfferDetail from "./pages/OfferDetail.jsx";
import About from "./pages/About.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Payment from "./pages/Payment.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="hotels" element={<ManageHotels />} />
        <Route path="rooms" element={<ManageRooms />} />
        <Route path="bookings" element={<ManageBookings />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="offers" element={<ManageOffers />} />
      </Route>

      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<OwnerOverview />} />
        <Route path="hotels" element={<OwnerHotels />} />
        <Route path="rooms" element={<OwnerRooms />} />
        <Route path="bookings" element={<OwnerBookings />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route path="/experience" element={<Experience />} />
        <Route path="/offers/:id" element={<OfferDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
