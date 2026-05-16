import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Search from "./pages/Search";
import Tracker from "./pages/Tracker";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-[#f0f4f8] dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        <main>
          <Routes>
            <Route path="/"        element={<Search />} />
            <Route path="/tracker" element={<Tracker />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  );
}
