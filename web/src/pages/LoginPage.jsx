import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import harbingerLogo from '../assets/harbinger_logo_actual.png';
import omBloodDropIcon from '../assets/om_blood_drop.svg';
import nabhBadgeIcon from '../assets/nabh_accredited_badge_real.png';
import Footer from '../components/layout/Footer';
import {
  Truck, Thermometer, Clock, Award,
  Mail, Lock, Eye, EyeOff, Zap, Phone
} from 'lucide-react';

const translations = {
  en: {
    centreTitle: 'Jankalyan Blood Centre, Pune',
    tag: 'RAKTDOOT TRACKER',
    heroLine1: 'Safe Blood Supply &',
    heroLine2: 'Real-Time Fleet Tracking',
    subtitle: 'Advanced digital platform for real-time monitoring of cold-chain blood transport and emergency hospital delivery across Pune.',
    cards: [
      { title: 'Live GPS Tracking', desc: 'Accurate vehicle location & ETA updates' },
      { title: 'Cold-Chain Monitoring', desc: '+2°C to +6°C temperature control' },
      { title: '24x7 Emergency Response', desc: 'Zero-delay emergency blood delivery' },
      { title: 'NABH Quality Standard', desc: 'Accredited quality & patient safety' },
    ],
    helpline: '24x7 Helpline: 020-24449527, 020-24444502',
    signInTitle: 'Sign In',
    signInSub: 'Enter your credentials to access RAKTDOOT TRACKER Portal',
    emailLabel: 'EMAIL ADDRESS / USER ID',
    passwordLabel: 'PASSWORD',
    submitBtn: 'Sign In',
    quickDemo: 'Quick Demo Login',
  },
  mr: {
    centreTitle: 'जनकल्याण रक्तपेढी, पुणे',
    tag: 'रक्तदूत (RAKTDOOT TRACKER)',
    heroLine1: 'सुरक्षित रक्त पुरवठा व',
    heroLine2: 'रियल-टाईम व्हईकल ट्रॅकिंग',
    subtitle: 'जनकल्याण रक्तपेढी, पुणे अंतर्गत आणीबाणीच्या प्रसंगी हॉस्पिटल व रुग्णांपर्यंत जलद, तापमान-नियंत्रित व सुरक्षित रक्त पिशव्या पोहोचवण्याची अद्ययावत डिजिटल प्रणाली.',
    cards: [
      { title: 'लाईव्ह GPS ट्रॅकिंग', desc: 'वाहनांचे अचूक लाईव्ह लोकेशन व ETA ट्रॅकिंग' },
      { title: 'कोल्ड-चेन मॉनिटरिंग', desc: '+२°C ते +६°C सुरक्षित तापमान नियंत्रण' },
      { title: '२४x७ आणीबाणी पुरवठा', desc: 'शून्य विलंबाने आणीबाणी रक्त पुरवठा' },
      { title: 'NABH मान्यताप्राप्त', desc: 'रुग्ण सुरक्षा व गुणवत्ता मानकांचे पालन' },
    ],
    helpline: '२४x७ आणीबाणी हेल्पलाइन: 020-24449527, 020-24444502',
    signInTitle: 'प्रवेश करा (Sign In)',
    signInSub: 'रक्तदूत ट्रॅकिंग पोर्टल वापरण्यासाठी तुमची माहिती प्रविष्ट करा',
    emailLabel: 'ईमेल पत्ता / वापरकर्ता आयडी',
    passwordLabel: 'संकेतशब्द (पासवर्ड)',
    submitBtn: 'प्रवेश करा (Sign In)',
    quickDemo: 'जलद प्रात्यक्षिक प्रवेश (Quick Demo)',
  }
};

export default function LoginPage() {
  const { user, login, loading, error, clearError } = useAuth();
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const t = translations[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalErr('');
    if (!email || !password) {
      setLocalErr(lang === 'en' ? 'Please enter email and password.' : 'कृपया ईमेल व पासवर्ड प्रविष्ट करा.');
      return;
    }
    try {
      await login(email, password);
    } catch (_) {}
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const displayError = error || localErr;

  return (
    <div className="brand-login-page">
      {/* Background glow effects */}
      <div className="brand-login-bg-glow" />

      {/* Top Header — Harbinger logo only */}
      <header className="brand-login-header">
        <div className="harbinger-brand">
          <img src={harbingerLogo} alt="Harbinger Group" className="harbinger-logo-img" />
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="brand-login-container">
        {/* Left Branding Column */}
        <section className="brand-info-section">
          {/* Header Badge Icons */}
          <div className="brand-badges-row">
            <div className="om-badge-circle" title="Jankalyan Blood Centre">
              <img src={omBloodDropIcon} alt="Jankalyan Om Blood Drop Emblem" className="brand-badge-img om-badge-img" />
            </div>

            <div className="nabh-badge-circle" title="NABH Accredited">
              <img src={nabhBadgeIcon} alt="NABH Accredited Quality Badge" className="brand-badge-img nabh-badge-img nabh-real-img" />
            </div>
          </div>

          {/* Title & Pill */}
          <h1 className="centre-title">{t.centreTitle}</h1>
          <div className="raktdoot-pill">
            <span className="heart-icon">❤️</span> {t.tag}
          </div>

          {/* Headline & Description */}
          <h2 className="hero-headline">
            {t.heroLine1}
            <span className="highlight-red"> {t.heroLine2}</span>
          </h2>
          <p className="hero-subtitle">{t.subtitle}</p>

          {/* 4 Feature Cards */}
          <div className="feature-cards-grid">
            <div className="feature-card">
              <div className="feature-icon-box icon-red">
                <Truck size={18} />
              </div>
              <div className="feature-text">
                <div className="feature-card-title">{t.cards[0].title}</div>
                <div className="feature-card-desc">{t.cards[0].desc}</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-cyan">
                <Thermometer size={18} />
              </div>
              <div className="feature-text">
                <div className="feature-card-title">{t.cards[1].title}</div>
                <div className="feature-card-desc">{t.cards[1].desc}</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-green">
                <Clock size={18} />
              </div>
              <div className="feature-text">
                <div className="feature-card-title">{t.cards[2].title}</div>
                <div className="feature-card-desc">{t.cards[2].desc}</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box icon-gold">
                <Award size={18} />
              </div>
              <div className="feature-text">
                <div className="feature-card-title">{t.cards[3].title}</div>
                <div className="feature-card-desc">{t.cards[3].desc}</div>
              </div>
            </div>
          </div>

          {/* Helpline Tag */}
          <div className="helpline-pill">
            <Phone size={13} className="helpline-icon" />
            <span>{t.helpline}</span>
          </div>
        </section>

        {/* Right Sign In Form Card */}
        <section className="brand-signin-section">
          {/* Language Selector — sits right above the card */}
          <div className="lang-selector signin-lang-selector">
            <button
              type="button"
              className={`lang-btn ${lang === 'mr' ? 'active' : ''}`}
              onClick={() => setLang('mr')}
            >
              मराठी
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
          </div>
          <div className="brand-signin-card">
            <h2 className="signin-title">{t.signInTitle}</h2>
            <p className="signin-subtitle">{t.signInSub}</p>

            {/* Error Message */}
            {displayError && (
              <div className="signin-error-banner">
                {displayError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-form">
              {/* Email Input */}
              <div className="form-group-custom">
                <label className="form-label-custom">{t.emailLabel}</label>
                <div className="input-wrap-custom">
                  <Mail size={16} className="input-icon-left" />
                  <input
                    id="login-email"
                    type="email"
                    className="input-field-custom"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver1@delivery.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group-custom">
                <label className="form-label-custom">{t.passwordLabel}</label>
                <div className="input-wrap-custom">
                  <Lock size={16} className="input-icon-left" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="input-field-custom input-field-pass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                className="brand-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-span">
                    <span className="spinner-dot" />
                    Signing in...
                  </span>
                ) : (
                  <span className="btn-content">
                    <Zap size={16} className="zap-icon" /> {t.submitBtn}
                  </span>
                )}
              </button>

              {/* Quick Demo Credentials Buttons */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', textAlign: 'center', fontWeight: 600 }}>
                  {t.quickDemo}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#fca5a5',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setEmail('manager@delivery.com');
                      setPassword('manager123');
                      clearError();
                      setLocalErr('');
                    }}
                  >
                    <span>Manager</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, color: '#f87171' }}>Pune Hub</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#93c5fd',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setEmail('admin@delivery.com');
                      setPassword('admin123');
                      clearError();
                      setLocalErr('');
                    }}
                  >
                    <span>Admin</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, color: '#60a5fa' }}>System</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#6ee7b7',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setEmail('driver1@delivery.com');
                      setPassword('driver123');
                      clearError();
                      setLocalErr('');
                    }}
                  >
                    <span>Driver 1</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, color: '#34d399' }}>Ravi K.</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Global Page Footer */}
      <Footer className="login-footer" />
    </div>
  );
}
