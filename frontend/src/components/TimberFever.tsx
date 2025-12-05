import React, { useState } from 'react';
import styled from 'styled-components';
import {
  TimberFeverWrapper,
  GameScene,
  SceneBackground,
  Ground,
  Tree,
  TreeTrunk,
  TreeCanopy,
  Lumberjack,
  LumberjackBody,
  LumberjackHead,
  LumberjackAxe,
  ActionPanel,
  ChopButton,
  GameInfo,
  InfoItem,
  InfoLabel,
  InfoValue,
  LobbyStatus,
  LobbyTitle,
  LobbySubtitle,
} from '../styles/TimberFever.styles';

const GifContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.bgDark};
`;

const ChoppingGif = styled.img`
  max-width: 100%;
  max-height: 80%;
  border-radius: 8px;
`;

interface TimberFeverProps {
  playerBalance: number;
}

const TimberFever: React.FC<TimberFeverProps> = ({ playerBalance }) => {
  const [hasChopped, setHasChopped] = useState(false);
  const [isChopping, setIsChopping] = useState(false);
  const [chopCount, setChopCount] = useState(0);

  const handleChop = () => {
    if (isChopping) return;
    
    setIsChopping(true);
    setChopCount(prev => prev + 1);
    setHasChopped(true);
    
    // Reset animacji po zakończeniu
    setTimeout(() => {
      setIsChopping(false);
    }, 300);
  };

  // Po kliknięciu "Zetnij" pokazujemy gif
  if (hasChopped) {
    return (
      <TimberFeverWrapper>
        <GifContainer>
          <ChoppingGif 
            src="https://i.pinimg.com/originals/89/5c/e7/895ce751ba0379700381d17a67086931.gif" 
            alt="Chopping wood"
          />
        </GifContainer>
      </TimberFeverWrapper>
    );
  }

  return (
    <TimberFeverWrapper>
      <GameScene>
        <SceneBackground />
        
        <LobbyStatus>
          <LobbyTitle>🪓 Timber Fever</LobbyTitle>
          <LobbySubtitle>Idle Lobby - Oczekiwanie na graczy</LobbySubtitle>
        </LobbyStatus>

        {/* Drwal */}
        <Lumberjack $isChopping={isChopping}>
          <LumberjackHead />
          <LumberjackBody />
          <LumberjackAxe $isChopping={isChopping} />
        </Lumberjack>

        {/* Drzewo */}
        <Tree $isChopping={isChopping}>
          <TreeCanopy />
          <TreeTrunk />
        </Tree>

        <Ground />
      </GameScene>

      <ActionPanel>
        <GameInfo>
          <InfoItem>
            <InfoLabel>Twój balans</InfoLabel>
            <InfoValue>${playerBalance}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Cięcia</InfoLabel>
            <InfoValue>{chopCount}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Gracze</InfoLabel>
            <InfoValue>1/8</InfoValue>
          </InfoItem>
        </GameInfo>

        <ChopButton onClick={handleChop} $disabled={false}>
          🪓 Zetnij
        </ChopButton>
      </ActionPanel>
    </TimberFeverWrapper>
  );
};

export default TimberFever;
