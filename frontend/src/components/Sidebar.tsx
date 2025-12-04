import React from 'react';
import {
  SidebarOverlay,
  SidebarWrapper,
  SidebarHeader,
  CloseButton,
  SidebarSection,
  SectionTitle,
  RoomList,
  RoomItem,
  RoomName,
  RoomMeta,
  GameList,
  GameItem,
  GameIcon,
  GameName,
} from '../styles/Sidebar.styles';

export interface Room {
  id: string;
  name: string;
  type: 'open-limit' | '1:1';
  minBet?: number;
  maxBet?: number;
  playersCount: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
  currentGame: 'grand-wager' | 'test-gra';
  onGameChange: (game: 'grand-wager' | 'test-gra') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  rooms, 
  selectedRoomId, 
  onRoomSelect,
  currentGame,
  onGameChange,
}) => {
  const openLimitRooms = rooms.filter(r => r.type === 'open-limit');
  const oneToOneRooms = rooms.filter(r => r.type === '1:1');

  const handleRoomClick = (roomId: string) => {
    onRoomSelect(roomId);
    onClose();
  };

  const handleGameClick = (game: 'grand-wager' | 'test-gra') => {
    onGameChange(game);
    if (game === 'test-gra') {
      onClose();
    }
  };

  return (
    <>
      <SidebarOverlay $visible={isOpen} onClick={onClose} />
      
      <SidebarWrapper $open={isOpen}>
        <SidebarHeader>
          <h2>Menu</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </SidebarHeader>

        <SidebarSection>
          <SectionTitle>Gry</SectionTitle>
          <GameList>
            <GameItem 
              $active={currentGame === 'grand-wager'}
              onClick={() => handleGameClick('grand-wager')}
            >
              <GameIcon>GW</GameIcon>
              <GameName>GRAND WAGER</GameName>
            </GameItem>
            <GameItem 
              $active={currentGame === 'test-gra'}
              onClick={() => handleGameClick('test-gra')}
            >
              <GameIcon>TG</GameIcon>
              <GameName>TEST_GRA</GameName>
            </GameItem>
          </GameList>
        </SidebarSection>

        {currentGame === 'grand-wager' && (
          <>
            <SidebarSection>
              <SectionTitle>Open Limit</SectionTitle>
              <RoomList>
                {openLimitRooms.map(room => (
                  <RoomItem
                    key={room.id}
                    $active={selectedRoomId === room.id}
                    onClick={() => handleRoomClick(room.id)}
                  >
                    <RoomName>{room.name}</RoomName>
                    <RoomMeta>{room.playersCount} online</RoomMeta>
                  </RoomItem>
                ))}
              </RoomList>
            </SidebarSection>

            <SidebarSection>
              <SectionTitle>Pojedynki 1:1</SectionTitle>
              <RoomList>
                {oneToOneRooms.map(room => (
                  <RoomItem
                    key={room.id}
                    $active={selectedRoomId === room.id}
                    onClick={() => handleRoomClick(room.id)}
                  >
                    <RoomName>{room.name}</RoomName>
                    <RoomMeta>{room.playersCount}/2</RoomMeta>
                  </RoomItem>
                ))}
              </RoomList>
            </SidebarSection>
          </>
        )}
      </SidebarWrapper>
    </>
  );
};

export default Sidebar;
