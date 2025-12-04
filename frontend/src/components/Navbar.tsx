import React, { useState } from 'react';
import {
  NavbarWrapper,
  MenuButton,
  NavLogo,
  NavUser,
  NavBalance,
  BalanceValue,
  BalanceIcon,
  UserButton,
  UserAvatar,
  DropdownOverlay,
  UserDropdown,
  DropdownHeader,
  DropdownAvatar,
  DropdownUsername,
  DropdownDivider,
  DropdownItem,
} from '../styles/Navbar.styles';

interface NavbarProps {
  balance: number;
  username: string;
  onMenuToggle: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  balance,
  username,
  onMenuToggle,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <NavbarWrapper>
      <MenuButton onClick={onMenuToggle} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </MenuButton>

      <NavLogo>GRAND WAGER</NavLogo>

      <NavUser>
        <NavBalance>
          <BalanceValue>{balance.toFixed(0)}</BalanceValue>
          <BalanceIcon>$</BalanceIcon>
        </NavBalance>
        
        <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
          <UserAvatar>
            {username.charAt(0).toUpperCase()}
          </UserAvatar>
        </UserButton>

        {showUserMenu && (
          <>
            <DropdownOverlay onClick={() => setShowUserMenu(false)} />
            <UserDropdown>
              <DropdownHeader>
                <DropdownAvatar>
                  {username.charAt(0).toUpperCase()}
                </DropdownAvatar>
                <DropdownUsername>{username}</DropdownUsername>
              </DropdownHeader>
              <DropdownDivider />
              <DropdownItem onClick={onLogout}>
                Wyloguj
              </DropdownItem>
            </UserDropdown>
          </>
        )}
      </NavUser>
    </NavbarWrapper>
  );
};

export default Navbar;
