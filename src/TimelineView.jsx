import React, { useState, useMemo } from 'react';

// Get day number from date string (same logic as main app)
const getDayNumber = (dateStr) => {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1]);
  const date = Date.UTC(2024, month, day);
  const yearStart = Date.UTC(2024, 0, 1);
  const dayIndex = Math.floor((date - yearStart) / (1000 * 60 * 60 * 24));
  let motuDay = dayIndex - 97;
  if (motuDay <= 0) motuDay += 366;
  return motuDay;
};

// Get month name from day number
const getMonthFromDay = (dayNum) => {
  // MOTU starts April 8
  const months = ['April', 'May', 'June', 'July', 'August', 'September',
                  'October', 'November', 'December', 'January', 'February', 'March', 'April'];
  const daysInMonth = [23, 31, 30, 31, 31, 30, 31, 30, 31, 31, 29, 31, 7]; // Adjusted for MOTU calendar

  let cumDays = 0;
  for (let i = 0; i < months.length; i++) {
    cumDays += daysInMonth[i];
    if (dayNum <= cumDays) {
      return months[i];
    }
  }
  return 'Unknown';
};

// Timeline View Component
const TimelineView = ({ nfts, onSelectNFT }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Process NFTs into timeline data grouped by month
  const timelineData = useMemo(() => {
    const grouped = {};

    nfts.forEach(nft => {
      const dayNum = getDayNumber(nft.date);
      const month = getMonthFromDay(dayNum);

      if (!grouped[month]) {
        grouped[month] = [];
      }

      grouped[month].push({
        ...nft,
        dayNumber: dayNum,
      });
    });

    // Sort items within each month
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => a.dayNumber - b.dayNumber);
    });

    // Convert to array and sort by MOTU calendar order
    const monthOrder = ['April', 'May', 'June', 'July', 'August', 'September',
                        'October', 'November', 'December', 'January', 'February', 'March'];

    return monthOrder
      .filter(month => grouped[month]?.length > 0)
      .map(month => ({
        month,
        items: grouped[month],
        count: grouped[month].length,
      }));
  }, [nfts]);

  // Get total stats
  const totalVideos = nfts.filter(n => n.type === 'video').length;
  const totalPolaroids = nfts.filter(n => n.type === 'polaroid').length;

  return (
    <div className="timeline-container">
      {/* Timeline Header */}
      <div className="timeline-header">
        <h2 className="timeline-title">The Journey</h2>
        <p className="timeline-subtitle">366 days of moments, collected over time</p>
        <div className="timeline-stats">
          <span>{nfts.length} Moments</span>
          <span className="stat-divider">•</span>
          <span>{totalVideos} Videos</span>
          <span className="stat-divider">•</span>
          <span>{totalPolaroids} Polaroids</span>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="timeline-track">
        <div className="timeline-line"></div>

        {timelineData.map((monthData, index) => (
          <div
            key={monthData.month}
            className={`timeline-month ${selectedMonth === monthData.month ? 'expanded' : ''}`}
          >
            {/* Month Marker */}
            <div
              className="month-marker"
              onClick={() => setSelectedMonth(
                selectedMonth === monthData.month ? null : monthData.month
              )}
            >
              <div className="marker-dot">
                <span className="marker-count">{monthData.count}</span>
              </div>
              <div className="marker-label">
                <span className="marker-month">{monthData.month}</span>
                <span className="marker-year">2024</span>
              </div>
            </div>

            {/* Expanded Month Items */}
            {selectedMonth === monthData.month && (
              <div className="month-items">
                {monthData.items.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="timeline-item"
                    onClick={() => onSelectNFT(item)}
                    style={{ animationDelay: `${itemIndex * 0.05}s` }}
                  >
                    <div className="item-preview">
                      {item.animationUrl ? (
                        <video
                          src={item.animationUrl}
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="item-placeholder">
                          <span>{item.type === 'video' ? '▶' : '◻'}</span>
                        </div>
                      )}
                    </div>
                    <div className="item-info">
                      <span className="item-day">Day {item.dayNumber}</span>
                      <span className="item-date">{item.date}</span>
                      <span className="item-location">{item.location}</span>
                      <span className="item-type" data-type={item.type}>
                        {item.type === 'video' ? 'Video' : 'Polaroid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Year Progress */}
      <div className="timeline-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(nfts.length / 366) * 100}%` }}
          ></div>
        </div>
        <div className="progress-label">
          <span>{nfts.length} of 366 moments collected</span>
          <span className="progress-percent">
            {Math.round((nfts.length / 366) * 100)}%
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="timeline-instructions">
        Click a month to explore moments
      </div>
    </div>
  );
};

export default TimelineView;
