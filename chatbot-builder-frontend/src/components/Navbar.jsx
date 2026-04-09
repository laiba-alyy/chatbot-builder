import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const navItems = [
  { label: "Features", hash: "features" },
  { label: "Workflow", hash: "workflow" },
  { label: "Pricing", hash: "pricing" },
  { label: "Testimonials", hash: "testimonials" },
];

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleNavClick = (e, hash) => {
    e.preventDefault();
    setMobileDrawerOpen(false);

    const scrollToSection = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (location.pathname !== "/") {
      // Navigate to home first, then scroll after page loads
      navigate("/");
      setTimeout(scrollToSection, 100);
    } else {
      // Already on home page, just scroll
      scrollToSection();
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-content">
          {/* Logo Section */}
          <div className="nav-brand">
            <img className="nav-logo" src={logo} alt="Logo" />
          </div>

          {/* Desktop Navigation */}
          <ul className="nav-links-desktop">
            {navItems.map((item, index) => (
              <li key={index}>
                <a
                  href={`/#${item.hash}`}
                  onClick={(e) => handleNavClick(e, item.hash)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Auth */}
          <div className="nav-auth-desktop">
            <Link to="/login" className="btn-signin" onClick={() => setMobileDrawerOpen(false)}>
              Sign In
            </Link>
            <Link to="/register" className="btn-signup" onClick={() => setMobileDrawerOpen(false)}>
              Create an account
            </Link>
          </div>

          {/* Mobile Toggle Button */}
          <div className="nav-mobile-toggle">
            <button onClick={toggleNavbar} aria-label="Toggle Navigation">
              {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div className="mobile-drawer">
            <ul>
              {navItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={`/#${item.hash}`}
                    onClick={(e) => handleNavClick(e, item.hash)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mobile-auth">
              <Link to="/login" className="btn-signin" onClick={() => setMobileDrawerOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn-signup" onClick={() => setMobileDrawerOpen(false)}>
                Create an account
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;