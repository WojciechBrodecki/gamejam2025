import styled, { keyframes, css } from 'styled-components';

const float1 = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -40px) rotate(15deg);
  }
  50% {
    transform: translate(60px, 20px) rotate(-10deg);
  }
  75% {
    transform: translate(20px, 50px) rotate(5deg);
  }
`;

const float2 = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(-40px, 30px) rotate(-15deg);
  }
  50% {
    transform: translate(-20px, -50px) rotate(10deg);
  }
  75% {
    transform: translate(30px, -20px) rotate(-5deg);
  }
`;

const float3 = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(50px, 40px) rotate(20deg);
  }
  66% {
    transform: translate(-30px, 60px) rotate(-15deg);
  }
`;

const float4 = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(-50px, -30px) rotate(-20deg);
  }
  66% {
    transform: translate(40px, -50px) rotate(15deg);
  }
`;

const chipSpin = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(20px, -30px) rotate(90deg) scale(1.1);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg) scale(0.9);
  }
  75% {
    transform: translate(30px, 10px) rotate(270deg) scale(1.05);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    box-shadow: 0 0 20px rgba(240, 192, 32, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 40px rgba(240, 192, 32, 0.6);
  }
`;

export const LoginPage = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bgDark} 0%, #151525 100%);
  position: relative;
  overflow: hidden;
`;

export const LoginBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

export const FloatingCard = styled.div<{ $variant: 1 | 2 | 3 | 4 }>`
  position: absolute;
  font-size: 4rem;
  opacity: 0.15;
  filter: blur(1px);
  animation-duration: ${({ $variant }) => 12 + $variant * 2}s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 1:
        return css`
          top: 10%;
          left: 10%;
          animation-name: ${float1};
        `;
      case 2:
        return css`
          top: 15%;
          right: 15%;
          animation-name: ${float2};
        `;
      case 3:
        return css`
          bottom: 20%;
          left: 20%;
          animation-name: ${float3};
        `;
      case 4:
        return css`
          bottom: 15%;
          right: 10%;
          animation-name: ${float4};
        `;
    }
  }}
`;

export const FloatingChip = styled.div<{ $variant: 1 | 2 }>`
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.2;
  ${({ $variant }) => css`animation: ${chipSpin} ${10 + $variant * 3}s ease-in-out infinite;`}
  
  ${({ $variant }) => $variant === 1 ? css`
    top: 40%;
    left: 5%;
  ` : css`
    top: 30%;
    right: 8%;
  `}
`;

export const GlowOrb = styled.div<{ $position: 'top' | 'bottom' }>`
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  filter: blur(100px);
  ${css`animation: ${pulse} 4s ease-in-out infinite;`}
  
  ${({ $position, theme }) => $position === 'top' ? css`
    top: -150px;
    right: -100px;
    background: ${theme.colors.gold};
    opacity: 0.1;
  ` : css`
    bottom: -150px;
    left: -100px;
    background: ${theme.colors.blue};
    opacity: 0.08;
  `}
`;

export const LoginContainer = styled.div`
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
`;

export const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

export const CasinoLogo = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gold};
  text-shadow: 0 0 30px rgba(240, 192, 32, 0.5);
`;

export const CasinoTagline = styled.p`
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 0.875rem;
  margin-top: 8px;
`;

export const LoginForm = styled.form`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 32px 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  backdrop-filter: blur(10px);

  h2 {
    text-align: center;
    font-size: 1.25rem;
    margin-bottom: 24px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const InputGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 0.8rem;
    margin-bottom: 8px;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 14px 16px;
    background: ${({ theme }) => theme.colors.bgDark};
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radiusSm};
    color: ${({ theme }) => theme.colors.text};
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.gold};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.textMuted};
    }
  }
`;

export const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gold} 0%, ${({ theme }) => theme.colors.goldDim} 100%);
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.bgDark};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(240, 192, 32, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ConnectionIndicator = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem;
`;

export const StatusDot = styled.span<{ $connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $connected, theme }) => $connected ? theme.colors.green : theme.colors.red};
  box-shadow: 0 0 8px ${({ $connected, theme }) => $connected ? theme.colors.green : theme.colors.red};
`;
