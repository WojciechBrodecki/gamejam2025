import React from 'react';
import {
  SidebarOverlay,
  SidebarWrapper,
  SidebarHeader,
  CloseButton,
  SidebarSection,
  SectionTitle,
  GameList,
  GameItem,
  GameIcon,
  GameName,
} from '../styles/Sidebar.styles';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentGame: 'grand-wager' | 'timber-fever';
  onGameChange: (game: 'grand-wager' | 'timber-fever') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentGame,
  onGameChange,
}) => {
  const handleGameClick = (game: 'grand-wager' | 'timber-fever') => {
    onGameChange(game);
    onClose();
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
          <SectionTitle>Wybierz grę</SectionTitle>
          <GameList>
            <GameItem 
              $active={currentGame === 'grand-wager'}
              onClick={() => handleGameClick('grand-wager')}
            >
              <GameIcon>🎰</GameIcon>
              <GameName>GRAND WAGER</GameName>
            </GameItem>
            <GameItem 
              $active={currentGame === 'timber-fever'}
              onClick={() => handleGameClick('timber-fever')}
            >
              <GameIcon>🪓</GameIcon>
              <GameName>TIMBER FEVER</GameName>
            </GameItem>
          </GameList>
        </SidebarSection>
      </SidebarWrapper>
    </>
  );
};

export default Sidebar;
