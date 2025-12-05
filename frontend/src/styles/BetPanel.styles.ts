import styled from 'styled-components';

export const BetPanelWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;

  @media (min-width: 400px) {
    padding: 20px;
  }
`;

export const BetPanelTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: 16px;
`;

export const BetControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

export const BetControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;

  @media (min-width: 400px) {
    gap: 8px;
  }
`;

export const BetModifierButton = styled.button<{ $variant?: 'danger' | 'success' }>`
  min-width: 36px;
  height: 36px;
  padding: 0 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ $variant, theme }) => {
    if ($variant === 'danger') return theme.colors.red;
    if ($variant === 'success') return theme.colors.green;
    return theme.colors.border;
  }};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ $variant, theme }) => {
    if ($variant === 'danger') return theme.colors.red;
    if ($variant === 'success') return theme.colors.green;
    return theme.colors.text;
  }};
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  @media (min-width: 400px) {
    min-width: 42px;
    height: 42px;
    padding: 0 8px;
    font-size: 0.8rem;
  }

  @media (min-width: 768px) {
    min-width: 48px;
    height: 48px;
    padding: 0 10px;
    font-size: 0.9rem;
  }

  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) => {
      if ($variant === 'danger') return 'rgba(224, 80, 80, 0.15)';
      if ($variant === 'success') return 'rgba(64, 192, 128, 0.15)';
      return theme.colors.bgHover;
    }};
    border-color: ${({ $variant, theme }) => {
      if ($variant === 'danger') return theme.colors.red;
      if ($variant === 'success') return theme.colors.green;
      return theme.colors.gold;
    }};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const BetInputWrapper = styled.div`
  width: 100%;
  max-width: 200px;
  position: relative;
`;

export const BetInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.gold};
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  transition: border-color 0.2s;

  @media (min-width: 400px) {
    height: 52px;
    font-size: 1.4rem;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.gold};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 400;
  }

  /* Hide number spinners */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

export const PlaceBetButton = styled.button`
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gold} 0%, ${({ theme }) => theme.colors.goldDim} 100%);
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.bgDark};
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 192, 32, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const BetInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const BetInfoItem = styled.div`
  text-align: center;
`;

export const BetInfoLabel = styled.div`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
`;

export const BetInfoValue = styled.div<{ $highlight?: boolean }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ $highlight, theme }) => $highlight ? theme.colors.green : theme.colors.text};
`;
