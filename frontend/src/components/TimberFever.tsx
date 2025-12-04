import React, { useState } from 'react';
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

interface TimberFeverProps {
  playerBalance: number;
}

const TimberFever: React.FC<TimberFeverProps> = ({ playerBalance }) => {
  const [isChopping, setIsChopping] = useState(false);
  const [chopCount, setChopCount] = useState(0);

  const handleChop = () => {
    if (isChopping) return;
    
    setIsChopping(true);
    setChopCount(prev => prev + 1);
    
    // Reset animacji po zakończeniu
    setTimeout(() => {
      setIsChopping(false);
    }, 300);
  };

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
