import styled, { keyframes, css } from 'styled-components';

// Animacje
const sway = keyframes`
  0%, 100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
`;

const idleAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
`;

const chopAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-45deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(240, 192, 32, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(240, 192, 32, 0.6);
  }
`;

// Główny kontener gry - fullscreen
export const TimberFeverWrapper = styled.div`
  position: fixed;
  top: 56px; /* wysokość navbaru */
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #1a3a2a 0%, #0d1f15 50%, #0a1810 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: 768px) {
    top: 64px;
  }
`;

// Scena gry (gdzie stoi drwal i drzewo)
export const GameScene = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  overflow: hidden;
`;

// Tło - low poly style (placeholder na gradient)
export const SceneBackground = styled.div`
  position: absolute;
  inset: 0;
  background: 
    /* Góry w tle */
    linear-gradient(135deg, transparent 40%, rgba(30, 60, 40, 0.5) 40%, rgba(30, 60, 40, 0.5) 45%, transparent 45%),
    linear-gradient(225deg, transparent 35%, rgba(25, 50, 35, 0.4) 35%, rgba(25, 50, 35, 0.4) 42%, transparent 42%),
    linear-gradient(180deg, #1a3a2a 0%, #0d1f15 60%, #0a1810 100%);
  pointer-events: none;
`;

// Podłoże (trawa)
export const Ground = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, #2d5a3d 0%, #1e3d2a 100%);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #3d7a4d;
  }
`;

// Drzewo (placeholder - później grafika)
export const Tree = styled.div<{ $isChopping?: boolean }>`
  position: relative;
  width: 120px;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transform-origin: bottom center;
  ${css`animation: ${sway} 4s ease-in-out infinite;`}

  @media (min-width: 768px) {
    width: 150px;
    height: 400px;
  }
`;

export const TreeTrunk = styled.div`
  width: 40px;
  height: 150px;
  background: linear-gradient(90deg, #5a3a20 0%, #8b5a30 50%, #5a3a20 100%);
  border-radius: 5px;
  position: absolute;
  bottom: 0;

  @media (min-width: 768px) {
    width: 50px;
    height: 200px;
  }
`;

export const TreeCanopy = styled.div`
  width: 120px;
  height: 180px;
  position: absolute;
  bottom: 120px;
  
  /* Low poly triangle style */
  background: 
    linear-gradient(135deg, #2d8a4e 25%, transparent 25%),
    linear-gradient(225deg, #2d8a4e 25%, transparent 25%),
    linear-gradient(45deg, #1e6b3a 25%, transparent 25%),
    linear-gradient(315deg, #1e6b3a 25%, transparent 25%);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);

  @media (min-width: 768px) {
    width: 150px;
    height: 240px;
    bottom: 160px;
  }
`;

// Drwal (placeholder - później grafika)
export const Lumberjack = styled.div<{ $isChopping?: boolean }>`
  position: absolute;
  bottom: 80px;
  left: calc(50% - 100px);
  width: 60px;
  height: 100px;
  z-index: 15;
  ${({ $isChopping }) => !$isChopping && css`animation: ${idleAnimation} 2s ease-in-out infinite;`}

  @media (min-width: 768px) {
    width: 80px;
    height: 130px;
    left: calc(50% - 130px);
  }
`;

export const LumberjackBody = styled.div`
  width: 100%;
  height: 70%;
  background: linear-gradient(180deg, #c94040 0%, #a03030 100%);
  border-radius: 10px 10px 5px 5px;
  position: absolute;
  bottom: 30%;
`;

export const LumberjackHead = styled.div`
  width: 35px;
  height: 35px;
  background: linear-gradient(180deg, #e8c4a0 0%, #d4a878 100%);
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  /* Broda */
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 25px;
    height: 15px;
    background: #5a3a20;
    border-radius: 0 0 10px 10px;
  }
`;

export const LumberjackAxe = styled.div<{ $isChopping?: boolean }>`
  position: absolute;
  right: -20px;
  top: 30%;
  width: 40px;
  height: 8px;
  background: #8b5a30;
  transform-origin: left center;
  ${({ $isChopping }) => $isChopping && css`animation: ${chopAnimation} 0.3s ease-in-out;`}

  /* Ostrze */
  &::after {
    content: '';
    position: absolute;
    right: -12px;
    top: -8px;
    width: 15px;
    height: 24px;
    background: linear-gradient(135deg, #a0a0a0 0%, #606060 100%);
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
  }
`;

// Panel akcji na dole
export const ActionPanel = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

export const ChopButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  max-width: 300px;
  height: 60px;
  background: ${({ $disabled }) => $disabled 
    ? 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%)'
    : 'linear-gradient(135deg, #f0c020 0%, #d4a010 100%)'
  };
  border: none;
  border-radius: ${({ theme }) => theme.radius};
  color: ${({ $disabled, theme }) => $disabled ? theme.colors.textDim : theme.colors.bgDark};
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s;
  ${({ $disabled }) => !$disabled && css`animation: ${pulseGlow} 2s ease-in-out infinite;`}

  &:hover:not(:disabled) {
    transform: ${({ $disabled }) => $disabled ? 'none' : 'scale(1.02)'};
  }

  &:active:not(:disabled) {
    transform: ${({ $disabled }) => $disabled ? 'none' : 'scale(0.98)'};
  }

  @media (min-width: 768px) {
    height: 70px;
    font-size: 1.75rem;
    max-width: 400px;
  }
`;

// Info o grze
export const GameInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

export const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const InfoValue = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gold};
`;

// Status lobby
export const LobbyStatus = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 13, 20, 0.8);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 12px 24px;
  text-align: center;
  z-index: 20;
`;

export const LobbyTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gold};
  margin-bottom: 4px;
`;

export const LobbySubtitle = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textDim};
`;
