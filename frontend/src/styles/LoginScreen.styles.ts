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

export const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

export const AvatarLabel = styled.label`
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 0.8rem;
  margin-bottom: 12px;
  font-weight: 500;
`;

export const AvatarPreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 3px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.gold};
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const AvatarPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    font-size: 0.65rem;
    text-align: center;
  }
`;

export const AvatarInput = styled.input`
  display: none;
`;

// Modal styles
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.1rem;
    margin: 0;
  }
`;

export const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const ModalOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ModalOption = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.gold};
    background: rgba(240, 192, 32, 0.1);
  }
  
  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.gold};
  }
`;

export const ModalOptionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  span:first-child {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  span:last-child {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

// Camera view styles
export const CameraContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const CameraPreview = styled.div`
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 3px solid ${({ theme }) => theme.colors.border};
  position: relative;
  
  video, canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CameraActions = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

export const CameraButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, ${theme.colors.gold}, #c0a020);
    border: none;
    color: #0d0d14;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(240, 192, 32, 0.4);
    }
  ` : `
    background: transparent;
    border: 1px solid ${theme.colors.border};
    color: ${theme.colors.text};
    
    &:hover {
      border-color: ${theme.colors.gold};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;
