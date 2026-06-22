import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function PublicLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Schedule", path: "/schedule" },
    { label: "About", path: "/about" },
    { label: "Testimonials", path: "/testimonials" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#A8A9AD]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 border-2 border-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C] transition-colors">
                <span className="text-[#C9A84C] group-hover:text-black font-bold text-lg transition-colors">C</span>
              </div>
              <div className="leading-none">
                <div className="font-bold text-sm tracking-widest uppercase">Chosen</div>
                <div className="text-[10px] tracking-[0.2em] text-[#A8A9AD] uppercase">Martial Arts Academy</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium tracking-wide uppercase transition-colors relative group ${
                    isActive(link.path) ? "text-[#C9A84C]" : "text-white hover:text-[#C9A84C]"
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-px bg-[#C9A84C] transition-all duration-300 ${
                    isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate(user?.role === "admin" ? "/admin" : "/portal")}
                  className="px-6 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
                >
                  {user?.role === "admin" ? "Dashboard" : "Member Portal"}
                </button>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium tracking-wide uppercase text-white hover:text-[#C9A84C] transition-colors">
                    Log In
                  </Link>
                  <a
                    href="#lead-form"
                    className="px-6 py-2.5 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#E0C97A] transition-colors"
                  >
                    Free Trial
                  </a>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#A8A9AD]/20 bg-[#0A0A0A]">
            <nav className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-3 text-sm font-medium tracking-wide uppercase border-b border-[#A8A9AD]/10 ${
                    isActive(link.path) ? "text-[#C9A84C]" : "text-white"
                  }`}
                >
                  {link.label}
                  <ChevronRight size={16} className="text-[#A8A9AD]" />
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate(user?.role === "admin" ? "/admin" : "/portal")}
                    className="px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase text-center"
                  >
                    {user?.role === "admin" ? "Dashboard" : "Member Portal"}
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-6 py-3 border border-[#A8A9AD]/40 text-white font-medium text-sm tracking-wide uppercase text-center">
                      Log In
                    </Link>
                    <a href="#lead-form" onClick={() => setMobileOpen(false)} className="px-6 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-wide uppercase text-center">
                      Free Trial
                    </a>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#A8A9AD]/20 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 border-2 border-[#C9A84C] flex items-center justify-center">
                  <span className="text-[#C9A84C] font-bold text-lg">C</span>
                </div>
                <div className="leading-none">
                  <div className="font-bold text-sm tracking-widest uppercase">Chosen</div>
                  <div className="text-[10px] tracking-[0.2em] text-[#A8A9AD] uppercase">Martial Arts Academy</div>
                </div>
              </div>
              <p className="text-[#A8A9AD] text-sm max-w-md leading-relaxed">
                Building discipline, confidence, and character through the art of karate. Train with purpose. Live with honor.
              </p>
            </div>

            <div>
              <h4 className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold mb-4">Explore</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-[#A8A9AD] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li><Link to="/login" className="text-sm text-[#A8A9AD] hover:text-white transition-colors">Member Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs tracking-widest uppercase text-[#C9A84C] font-bold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="https://shop.chosenmartialarts.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#A8A9AD] hover:text-white transition-colors">Merchandise Store</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#A8A9AD] hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#A8A9AD] hover:text-white transition-colors">Facebook</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#A8A9AD] hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#A8A9AD]/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#A8A9AD]">© 2026 Chosen Martial Arts Academy. All rights reserved.</p>
            <p className="text-xs text-[#A8A9AD]">Discipline • Respect • Perseverance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}