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

export const CreateRoomButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: ${({ theme }) => theme.colors.gold};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.goldDim};
    transform: translateY(-1px);
  }
`;

export const CurrentRoomBadge = styled.div`
  background: rgba(240, 192, 32, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.gold};
  border-radius: ${({ theme }) => theme.radiusSm};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const LeaveRoomButton = styled.button`
  padding: 8px 12px;
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: ${({ theme }) => theme.radiusSm};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 4px;

  &:hover {
    background: rgba(220, 53, 69, 0.3);
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 24px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textDim};
    margin-top: 4px;
  }
`;

export const ModalTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const ModalInput = styled.input`
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.gold};
  }
`;

export const ModalSelect = styled.select`
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.gold};
  }
`;

export const ModalButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

export const ModalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
  
  ${({ $primary, theme }) => $primary ? `
    background: ${theme.colors.gold};
    color: #000;
    border: none;

    &:hover {
      background: ${theme.colors.goldDim};
    }
  ` : `
    background: transparent;
    color: ${theme.colors.textDim};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.bgHover};
      color: ${theme.colors.text};
    }
  `}
`;

export const CreateRoomModal = styled.div``;
