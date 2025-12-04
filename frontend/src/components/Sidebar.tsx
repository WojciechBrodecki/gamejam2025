import React from 'react';

export interface Room {
  id: string;
  name: string;
  type: 'open-limit' | '1:1';
  minBet?: number;
  maxBet?: number;
  playersCount: number;
}

interface SidebarProps {
  rooms: Room[];
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ rooms, selectedRoomId, onRoomSelect }) => {
  const openLimitRooms = rooms.filter(r => r.type === 'open-limit');
  const oneToOneRooms = rooms.filter(r => r.type === '1:1');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Pokoje</h3>
      </div>

      <div className="room-section">
        <h4 className="room-section-title">
          <span className="section-icon">🎲</span>
          Open Limit
        </h4>
        <div className="room-list">
          {openLimitRooms.map(room => (
            <button
              key={room.id}
              className={`room-item ${selectedRoomId === room.id ? 'active' : ''}`}
              onClick={() => onRoomSelect(room.id)}
            >
              <div className="room-info">
                <span className="room-name">{room.name}</span>
                <span className="room-players">{room.playersCount} graczy</span>
              </div>
              <div className="room-limits">
                {room.minBet && room.maxBet && (
                  <span>{room.minBet} - {room.maxBet} 💰</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="room-section">
        <h4 className="room-section-title">
          <span className="section-icon">⚔️</span>
          Pojedynki 1:1
        </h4>
        <div className="room-list">
          {oneToOneRooms.map(room => (
            <button
              key={room.id}
              className={`room-item ${selectedRoomId === room.id ? 'active' : ''}`}
              onClick={() => onRoomSelect(room.id)}
            >
              <div className="room-info">
                <span className="room-name">{room.name}</span>
                <span className="room-players">{room.playersCount}/2 graczy</span>
              </div>
              <div className="room-limits">
                {room.minBet && <span>Wejście: {room.minBet} 💰</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
