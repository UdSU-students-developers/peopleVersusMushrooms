import React from 'react';
import cn from 'classnames';

import './Button.scss';

export type TButton = {
    variant?: string;
    isHover?: boolean;
    className?: string;
    text?: string;
    onClick: (a: any) => void;
    isDisabled?: boolean;
    id?: string;
    children?: React.ReactNode;
    title?: string;
}

const Button: React.FC<TButton> = (props: TButton) => {
    const {
        variant = 'main',
        isHover = false,
        className,
        text,
        onClick = () => { },
        isDisabled = false,
        id,
        children,
        title
    } = props;

    return (
        <button
            className={cn('button', `button-${variant}`, className, { 'hover': isHover, 'disabled': isDisabled })}
            onClick={onClick}
            id={id}
            title={title}
        >
            {text}
            {children}
        </button>
    );
}

export default Button;