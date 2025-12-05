import styled, { keyframes, css } from 'styled-components';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const balancePop = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
`;

const balanceGlow = keyframes`
  0% {
    box-shadow: 0 0 0 rgba(64, 192, 128, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(64, 192, 128, 0.6);
  }
  100% {
    box-shadow: 0 0 0 rgba(64, 192, 128, 0);
  }
`;

export const NavbarWrapper = styled.nav`
  height: 56px;
  background: ${({ theme }) => theme.colors.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  position: sticky;
  top: 0;
  z-index: 100;

  @media (min-width: 768px) {
    height: 64px;
    padding: 0 24px;
  }
`;

export const MenuButton = styled.button`
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 8px;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background: ${({ theme }) => theme.colors.text};
    border-radius: 1px;
    transition: all 0.2s;
  }

  &:hover span {
    background: ${({ theme }) => theme.colors.gold};
  }
`;

export const NavLogo = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gold};
  letter-spacing: 1px;

  @media (min-width: 768px) {
    font-size: 1.3rem;
  }
`;

export const NavUser = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`;

export const NavBalance = styled.div<{ $animate?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(64, 192, 128, 0.15);
  border-radius: 20px;
  transition: all 0.3s ease;
  
  ${({ $animate }) => $animate && css`
    animation: ${balancePop} 0.4s ease, ${balanceGlow} 0.6s ease;
  `}
`;

export const BalanceValue = styled.span`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.green};
  transition: all 0.3s ease;
`;

export const BalanceIcon = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.green};
`;

export const UserButton = styled.button`
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

export const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.blue}, #8040c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  overflow: hidden;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const DropdownOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 199;
`;

export const UserDropdown = styled.div`
  position: absolute;
  top: 48px;
  right: 0;
  width: 200px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius};
  overflow: hidden;
  z-index: 200;
  ${css`animation: ${slideDown} 0.15s ease;`}
`;

export const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
`;

export const DropdownAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.blue}, #8040c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  overflow: hidden;
`;

export const DropdownAvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const DropdownUsername = styled.span`
  font-weight: 500;
`;

export const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

export const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

export const LeaveButton = styled.button`
  padding: 6px 10px;
  background: rgba(192, 57, 43, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: rgba(192, 57, 43, 0.35);
    border-color: rgba(231, 76, 60, 0.5);
  }

  @media (min-width: 768px) {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
`;
