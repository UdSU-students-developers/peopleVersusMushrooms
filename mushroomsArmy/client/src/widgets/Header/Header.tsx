import React from 'react';
import './Header.css';
import '../headerThemes.css';

import { UI_SCALES } from '../uiScales';
import type { HeaderProps } from './types';

const Header: React.FC<HeaderProps> = ({
  theme,
  scale = 'M',

  title = 'mushrooms army',
  nickname,

  showNickname = false,
  showMenuButton = true,

  isMenuOpen = false,

  onMenuClick,
}) => {
  const currentScale = UI_SCALES[scale];

  const cssVariables = {
    '--header-height': `${currentScale.headerHeight}px`,
    '--title-font-size': `${currentScale.titleFont}px`,
    '--font-base': `${currentScale.baseFont}px`,
    '--font-small': `${currentScale.smallFont}px`,
  } as React.CSSProperties;

  return (
    <header
      className={`
        header
        header--theme-${theme}
        ${isMenuOpen ? 'header--menu-open' : ''}
      `}
      style={cssVariables}
    >
      <div className="header__safe-area">

        <div className="header__left">
          {showNickname && (
            <span className="header__nickname">
              {nickname}
            </span>
          )}
        </div>

        <div className="header__center">
          <h1 className="header__title">
            {title}
          </h1>
        </div>

        <div className="header__right">
          {showMenuButton && (
            <button
              type="button"
              className="header__menu-button"
              onClick={onMenuClick}
            >
              menu
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;