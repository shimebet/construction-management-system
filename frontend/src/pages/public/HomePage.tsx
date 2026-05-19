import { Link } from 'react-router-dom';

const sectors = [
  {
    title: 'Building Construction',
    text: 'Commercial towers, residential buildings, offices, hospitals, schools, and mixed-use developments.',
    image:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Road Construction',
    text: 'Highways, road networks, bridges, asphalt works, drainage systems, and transportation infrastructure.',
    image:
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Real Estate Construction',
    text: 'Modern apartments, gated communities, commercial real estate, and urban developments.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Industrial Park Construction',
    text: 'Factories, logistics centers, warehouses, industrial zones, and utility infrastructure.',
    image:
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Smart City Construction',
    text: 'Digitally connected urban infrastructure, intelligent transportation, and sustainable city systems.',
    image:
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Infrastructure Projects',
    text: 'Large-scale public and private infrastructure projects with integrated planning and project controls.',
    image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
  },
];

const modules = [
  'Project Management',
  'Planning & Scheduling',
  'Document Control',
  'RFIs & Submittals',
  'Quality Management',
  'Safety Management',
  'Procurement',
  'Inventory',
  'Cost Control',
  'Finance',
  'Reports & Dashboards',
  'Audit Logs',
];

export default function HomePage() {
  return (
    <div className="company-public-page">
      {/* HERO */}
      <section className="company-hero">
        <img
          className="company-hero-image"
          src="https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=1800&q=80"
          alt="Construction company"
        />

        <div className="company-hero-overlay" />

        <div className="company-hero-content">
          <span className="company-badge">
            Building • Roads • Real Estate • Smart Cities
          </span>

          <h1>
            Engineering modern construction with digital project control.
          </h1>

          <p>
            We deliver building construction, road construction, industrial
            parks, real estate developments, smart city projects, and major
            infrastructure works using integrated construction management and
            digital project control systems.
          </p>

          <div className="company-hero-actions">
            <Link to="/login" className="company-primary-btn">
              Access Platform
            </Link>

            <a href="#contact" className="company-secondary-btn">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="company-section">
        <div className="company-section-heading">
          <span>About Company</span>

          <h2>
            Construction excellence powered by engineering and technology.
          </h2>

          <p>
            Our company delivers construction and infrastructure solutions for
            public, commercial, industrial, and urban development projects.
            BuildPro IMS supports international-standard project management,
            document control, quality, safety, cost, procurement, and finance.
          </p>
        </div>

        <div className="company-about-grid">
          <div className="company-info-card">
            <h3>Mission</h3>

            <p>
              To deliver quality construction projects with safety, efficiency,
              accountability, and digital project visibility.
            </p>
          </div>

          <div className="company-info-card">
            <h3>Vision</h3>

            <p>
              To become a leading construction and infrastructure company using
              modern engineering, innovation, and smart construction management.
            </p>
          </div>

          <div className="company-info-card">
            <h3>Core Values</h3>

            <p>
              Integrity, quality, safety, innovation, sustainability, teamwork,
              and client satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section id="sectors" className="company-section company-light-section">
        <div className="company-section-heading">
          <span>Our Work</span>

          <h2>Main construction sectors we serve.</h2>

          <p>
            We support complex construction and infrastructure projects with
            integrated engineering management, planning, reporting, procurement,
            and project controls.
          </p>
        </div>

        <div className="company-sector-grid">
          {sectors.map((sector) => (
            <article key={sector.title} className="company-sector-card">
              <img src={sector.image} alt={sector.title} />

              <div>
                <h3>{sector.title}</h3>
                <p>{sector.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SYSTEM */}
      <section id="system" className="company-section">
        <div className="company-section-heading">
          <span>BuildPro IMS</span>

          <h2>One platform for complete construction management.</h2>

          <p>
            BuildPro IMS integrates project management, planning, document
            control, procurement, quality, safety, cost, finance, and reporting
            into one digital construction platform.
          </p>
        </div>

        <div className="company-module-grid">
          {modules.map((module) => (
            <div key={module} className="company-module-card">
              {module}
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="company-section company-light-section">
        <div className="company-contact-card">
          <div>
            <span>Contact Us</span>

            <h2>Ready to build projects digitally?</h2>

            <p>
              Contact us for construction services, infrastructure delivery,
              project management, industrial park development, smart city
              projects, and BuildPro IMS implementation.
            </p>
          </div>

          <div className="company-contact-details">
            <p>
              <strong>Email:</strong> info@buildproims.com
            </p>

            <p>
              <strong>Phone:</strong> +251 900 000 000
            </p>

            <p>
              <strong>Location:</strong> Addis Ababa, Ethiopia
            </p>

            <p>
              <strong>Services:</strong> Construction, Infrastructure, Real
              Estate, Smart Cities, and Digital Project Management
            </p>
          </div>
        </div>
      </section>

      <footer className="company-footer">
        © {new Date().getFullYear()} BuildPro IMS. All rights reserved.
      </footer>
    </div>
  );
}