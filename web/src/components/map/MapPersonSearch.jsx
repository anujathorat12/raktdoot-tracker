import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Crosshair, User, AlertCircle, ChevronRight, Maximize2, ShieldAlert, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_COLORS = {
  active: '#10b981',
  idle: '#f59e0b',
  issue: '#ef4444',
  offline: '#6b7280',
};

const STATUS_LABELS = {
  active: 'Active',
  idle: 'Idle',
  issue: 'Issue Alert',
  offline: 'Offline',
};

export default function MapPersonSearch({
  drivers = [],
  selectedDriverId = null,
  onSelectPerson,
  onResetView,
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Selected driver reference
  const selectedDriver = useMemo(
    () => drivers.find(d => d.id === selectedDriverId),
    [drivers, selectedDriverId]
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter drivers based on search query and status tab
  const filtered = useMemo(() => {
    return drivers.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const nameMatch = d.name?.toLowerCase().includes(q);
      const emailMatch = d.email?.toLowerCase().includes(q);
      const phoneMatch = d.phone?.toLowerCase().includes(q);
      const idMatch = String(d.id || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || idMatch;
    });
  }, [drivers, query, statusFilter]);

  // Handle selecting a person
  const handleSelect = (driver) => {
    setIsOpen(false);
    setActiveIndex(-1);

    const hasCoords = driver.lat && driver.lng && (driver.lat !== 0 || driver.lng !== 0);

    if (!hasCoords) {
      setFeedbackMsg({
        type: 'warning',
        text: `"${driver.name}" is ${driver.status || 'offline'} with no GPS coordinates reported yet.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4500);
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Navigated to ${driver.name} (${Math.round(driver.speed || 0)} km/h)`,
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }

    onSelectPerson?.(driver);
  };

  // Clear search and reset map focus
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    onResetView?.();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        handleSelect(filtered[activeIndex]);
      } else if (filtered.length === 1) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      className="map-person-search-container"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      {/* Primary Search Bar */}
      <div className={`map-person-search-bar ${isOpen ? 'focused' : ''} ${selectedDriver ? 'has-selected' : ''}`}>
        <div className="search-icon-wrapper">
          <Search size={16} className="search-icon" />
        </div>

        <input
          ref={inputRef}
          id="input-map-person-search"
          type="text"
          className="map-person-search-input"
          placeholder={t.searchMapPlaceholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Action icons */}
        <div className="search-actions">
          {query ? (
            <button
              id="btn-clear-map-search"
              type="button"
              className="search-action-btn"
              onClick={handleClear}
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <div className="search-badge" title={t.totalVehiclesTooltip}>
              <User size={11} style={{ marginRight: 3 }} />
              {drivers.length}
            </div>
          )}
        </div>
      </div>

      {/* Selected Person Sticky Banner (if a person is focused) */}
      {selectedDriver && !isOpen && (
        <div className="map-selected-person-chip animate-fade-in">
          <div
            className="selected-person-avatar"
            style={{ background: selectedDriver.avatar_color || '#6366f1' }}
          >
            {selectedDriver.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
          </div>
          <div className="selected-person-info">
            <div className="selected-person-name">
              <span className="target-dot" style={{ background: STATUS_COLORS[selectedDriver.status] || '#6b7280' }} />
              {selectedDriver.name}
            </div>
            <div className="selected-person-sub">
              {STATUS_LABELS[selectedDriver.status] || 'Unknown'} · {Math.round(selectedDriver.speed || 0)} km/h
            </div>
          </div>

          <div className="selected-person-actions">
            <button
              id="btn-recenter-selected"
              type="button"
              className="chip-btn chip-btn-primary"
              onClick={() => handleSelect(selectedDriver)}
              title="Center on this person"
            >
              <Crosshair size={13} />
              <span>Locate</span>
            </button>
            <button
              id="btn-reset-map-view"
              type="button"
              className="chip-btn chip-btn-secondary"
              onClick={handleClear}
              title="Reset map to show entire fleet"
            >
              <Maximize2 size={13} />
              <span>View All</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Feedback Banner (e.g. No GPS signal warning) */}
      {feedbackMsg && (
        <div className={`map-search-feedback ${feedbackMsg.type} animate-slide-up`}>
          {feedbackMsg.type === 'warning' ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            className="feedback-dismiss"
            onClick={() => setFeedbackMsg(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Search Dropdown Results */}
      {isOpen && (
        <div ref={dropdownRef} className="map-person-search-dropdown animate-fade-in">
          {/* Quick filter tabs */}
          <div className="dropdown-filter-bar">
            {['all', 'active', 'idle', 'issue', 'offline'].map(status => {
              const count = status === 'all'
                ? drivers.length
                : drivers.filter(d => d.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status !== 'all' && (
                    <span
                      className="filter-pill-dot"
                      style={{ background: STATUS_COLORS[status] }}
                    />
                  )}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="filter-pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div className="dropdown-results-list">
            {filtered.length === 0 ? (
              <div className="dropdown-empty-state">
                <AlertCircle size={22} style={{ opacity: 0.4, marginBottom: 6 }} />
                <div>No person found matching "{query}"</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Try searching by first name, email address, or phone number
                </div>
              </div>
            ) : (
              filtered.map((driver, index) => {
                const isItemActive = index === activeIndex;
                const isSelected = selectedDriverId === driver.id;
                const hasGps = driver.lat && driver.lng && (driver.lat !== 0 || driver.lng !== 0);
                const initials = driver.name
                  ? driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '??';

                return (
                  <div
                    key={driver.id}
                    id={`search-result-driver-${driver.id}`}
                    className={`dropdown-person-item ${isItemActive ? 'keyboard-active' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(driver)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {/* Avatar */}
                    <div className="person-avatar-wrap">
                      <div
                        className="person-avatar"
                        style={{ background: driver.avatar_color || '#6366f1' }}
                      >
                        {initials}
                      </div>
                      <span
                        className="person-status-badge"
                        style={{ background: STATUS_COLORS[driver.status] || '#6b7280' }}
                      />
                    </div>

                    {/* Information */}
                    <div className="person-info">
                      <div className="person-title-row">
                        <span className="person-name">{driver.name}</span>
                        {driver.status === 'issue' && (
                          <span className="person-alert-tag">
                            <ShieldAlert size={10} /> Alert
                          </span>
                        )}
                        {isSelected && (
                          <span className="person-selected-tag">Selected</span>
                        )}
                      </div>

                      <div className="person-details-row">
                        <span style={{ color: STATUS_COLORS[driver.status], fontWeight: 600, textTransform: 'capitalize' }}>
                          {driver.status || 'offline'}
                        </span>
                        {driver.speed > 0 && (
                          <>
                            <span className="sep">·</span>
                            <span className="mono">{Math.round(driver.speed)} km/h</span>
                          </>
                        )}
                        {driver.phone && (
                          <>
                            <span className="sep">·</span>
                            <span>{driver.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Location Status & Action */}
                    <div className="person-action-wrap">
                      {hasGps ? (
                        <div className="gps-live-badge" title={`Live coordinates: ${driver.lat?.toFixed(3)}, ${driver.lng?.toFixed(3)}`}>
                          <MapPin size={12} style={{ color: '#10b981' }} />
                          <span>On Map</span>
                        </div>
                      ) : (
                        <div className="gps-offline-badge" title="No live GPS coordinates reported">
                          <AlertCircle size={12} style={{ color: '#94a3b8' }} />
                          <span>No GPS</span>
                        </div>
                      )}
                      <ChevronRight size={14} className="action-chevron" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Hint */}
          <div className="dropdown-footer">
            <span>Tip: Press <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to locate on map</span>
            {selectedDriver && (
              <button
                type="button"
                className="btn-view-all"
                onClick={handleClear}
              >
                Reset Map
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
