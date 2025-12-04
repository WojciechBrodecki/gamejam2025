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

export const ErrorToast = styled.div`
  padding: 12px 16px;
  background: rgba(224, 80, 80, 0.15);
  border: 1px solid ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.red};
  margin-bottom: 16px;
  font-size: 0.9rem;
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

// NotFound Page
export const NotFoundPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 20px;

  h1 {
    font-size: 1.5rem;
    margin: 16px 0 8px;
  }
`;

export const ErrorCode = styled.div`
  font-size: 5rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gold};
  line-height: 1;
`;

export const ErrorDescription = styled.p`
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 24px;
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${({ theme }) => theme.colors.gold};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.bgDark};
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(240, 192, 32, 0.4);
  }
`;

// Test Gra placeholder
export const TestGraPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  padding: 40px;
  text-align: center;
`;

export const PlaceholderIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

export const PlaceholderTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text};
`;

export const PlaceholderText = styled.p`
  color: ${({ theme }) => theme.colors.textDim};
`;
