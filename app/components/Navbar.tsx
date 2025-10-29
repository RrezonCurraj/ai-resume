import { Link } from 'react-router';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient"> Hireon</p>
      </Link>
      <div className="flex gap-4">
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
