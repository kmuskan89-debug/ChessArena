import { useEffect, useRef } from 'react';

export default function MovesPanel({ movePairs }) {
  const bottomRef = useRef(null);

  // Auto-scroll to the latest move whenever movePairs updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [movePairs]);

  return (
    <div className="panel moves-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">📋</span>
          <h3 className="panel-title">MOVES</h3>
        </div>
        <span className="moves-count-pill">
          {movePairs.length === 0 ? '0 turns' : `${movePairs.length} turns`}
        </span>
      </div>

      <div className="moves-list-scrollable">
        {movePairs.length === 0 ? (
          <div className="moves-empty-state">
            <span className="empty-state-icon">♟</span>
            <p>Game started. Make a move on the board to begin!</p>
          </div>
        ) : (
          <table className="moves-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th className="th-white">White</th>
                <th className="th-black">Black</th>
              </tr>
            </thead>
            <tbody>
              {movePairs.map((pair, index) => {
                const isLatest = index === movePairs.length - 1;
                return (
                  <tr key={pair.moveNumber} className={`move-row ${isLatest ? 'latest-row' : ''}`}>
                    <td className="td-num">{pair.moveNumber}.</td>
                    <td className={`td-move white-move ${isLatest && !pair.black ? 'active-san' : ''}`}>
                      {pair.white?.san}
                    </td>
                    <td className={`td-move black-move ${isLatest && pair.black ? 'active-san' : ''}`}>
                      {pair.black?.san || '...'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

