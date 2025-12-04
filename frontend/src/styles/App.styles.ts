import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const AppWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const FullScreenLoader = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgDark};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  gap: 20px;
`;

export const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${({ theme }) => theme.colors.bgCard};
  border-top-color: ${({ theme }) => theme.colors.gold};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const LoaderText = styled.div`
  color: ${({ theme }) => theme.colors.gold};
  font-size: 1rem;
  font-weight: 500;
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 16px;

  @media (min-width: 768px) {
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }
`;

export const ConnectionDot = styled.div<{ $online: boolean }>`
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $online, theme }) => $online ? theme.colors.green : theme.colors.red};
  box-shadow: 0 0 8px ${({ $online, theme }) => $online ? theme.colors.green : theme.colors.red};
`;

