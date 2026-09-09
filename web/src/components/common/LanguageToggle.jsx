import { useLanguage } from '../../context/LanguageContext';

export default function LanguageToggle({ className = '', style = {} }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`lang-selector ${className}`} style={style} role="group" aria-label="Language selection">
      <button
        id="btn-lang-mr"
        type="button"
        className={`lang-btn ${lang === 'mr' ? 'active' : ''}`}
        onClick={() => setLang('mr')}
        title="मराठी मध्ये बदला"
      >
        मराठी
      </button>
      <button
        id="btn-lang-en"
        type="button"
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
}
