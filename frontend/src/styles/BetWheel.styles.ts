import styled, { keyframes, css } from 'styled-components';

// Animacja kręcenia koła
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Animacja pulsowania timera
const timerPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    text-shadow: 0 0 20px rgba(240, 192, 32, 0.5);
  }
  50% {
    transform: scale(1.05);
    text-shadow: 0 0 40px rgba(240, 192, 32, 0.8);
  }
`;

const warningPulse = keyframes`
  0%, 100% {
    color: #f0c020;
  }
  50% {
    color: #e05050;
  }
`;

export const WheelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
`;

export const WheelWrapper = styled.div`
  position: relative;
  width: 280px;
  height: 280px;

  @media (min-width: 768px) {
    width: 320px;
    height: 320px;
  }
`;

export const WheelPointer = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 20px solid ${({ theme }) => theme.colors.gold};
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
`;

export const WheelSvg = styled.svg<{ $spinning: boolean; $spinDuration?: number; $targetRotation?: number }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 
    0 0 0 4px ${({ theme }) => theme.colors.gold},
    0 0 20px rgba(240, 192, 32, 0.3),
    inset 0 0 30px rgba(0,0,0,0.5);
  
  ${({ $spinning }) => $spinning && css`
    animation: ${spin} 0.15s linear infinite;
  `}
  
  /* Ease-out transition for smooth slowdown */
  transition: ${({ $spinning }) => $spinning ? 'none' : 'transform 5s cubic-bezier(0.15, 0.85, 0.25, 1)'};
  transform: ${({ $targetRotation }) => $targetRotation ? `rotate(${$targetRotation}deg)` : 'rotate(0deg)'};
`;

export const TimerCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 3px solid ${({ theme }) => theme.colors.gold};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);

  @media (min-width: 768px) {
    width: 140px;
    height: 140px;
  }
`;

export const TimerValue = styled.div<{ $warning?: boolean }>`
  font-size: 2.5rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: ${({ theme }) => theme.colors.gold};
  
  ${({ $warning }) => $warning 
    ? css`animation: ${warningPulse} 0.5s ease-in-out infinite;`
    : css`animation: ${timerPulse} 2s ease-in-out infinite;`
  }

  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

export const TimerLabel = styled.div`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.textDim};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const PoolInfo = styled.div`
  text-align: center;
`;

export const PoolLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textDim};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

export const PoolValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.green};
`;

// Winner display
const winnerAppear = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

export const WinnerOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(13, 13, 20, 0.98);
  border: 3px solid ${({ theme }) => theme.colors.gold};
  border-radius: ${({ theme }) => theme.radius};
  padding: 24px 40px;
  text-align: center;
  z-index: 20;
  min-width: 200px;
  box-shadow: 0 0 40px rgba(240, 192, 32, 0.4);
  ${css`animation: ${winnerAppear} 0.5s ease;`}
`;

export const WinnerIcon = styled.div<{ $color?: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${({ $color }) => $color || '#f0c020'};
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  box-shadow: 0 0 20px ${({ $color }) => $color || '#f0c020'}80;
`;

export const WinnerTitle = styled.div<{ $isYou?: boolean }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ $isYou, theme }) => $isYou ? theme.colors.green : theme.colors.textDim};
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

export const WinnerName = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gold};
  margin-bottom: 8px;
`;

export const WinnerAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.green};
  margin-bottom: 8px;
`;

export const WinnerChance = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textDim};
  
  span {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
  }
`;

// Legenda graczy
export const PlayersLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  max-width: 400px;
`;

export const PlayerLegendItem = styled.div<{ $color: string; $isYou?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ $isYou, theme }) => $isYou ? theme.colors.blue : theme.colors.border};
  border-radius: 20px;
  font-size: 0.8rem;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
`;

export const PlayerPercent = styled.span`
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 0.75rem;
`;
