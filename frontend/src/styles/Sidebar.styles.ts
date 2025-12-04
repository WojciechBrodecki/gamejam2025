import styled from 'styled-components';

export const SidebarOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 150;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  transition: all 0.25s ease;
`;

export const SidebarWrapper = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgCard};
  z-index: 160;
  transform: translateX(${({ $open }) => $open ? '0' : '-100%'});
  transition: transform 0.25s ease;
  overflow-y: auto;
`;

export const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

export const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const SidebarSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDim};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

export const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const RoomItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: ${({ $active, theme }) => $active ? `rgba(240, 192, 32, 0.15)` : 'none'};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ $active, theme }) => $active ? theme.colors.gold : theme.colors.text};
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

export const RoomName = styled.span`
  font-weight: 500;
`;

export const RoomMeta = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textDim};
`;

export const GameList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const GameItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ $active, theme }) => $active ? `rgba(240, 192, 32, 0.15)` : 'none'};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ $active, theme }) => $active ? theme.colors.gold : theme.colors.text};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

export const GameIcon = styled.span`
  font-size: 1.4rem;
  width: 32px;
  text-align: center;
`;

export const GameName = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
`;
