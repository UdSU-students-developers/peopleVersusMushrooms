import React, { useState } from 'react';
import type { GameRole } from '../../config';
import CONFIG from '../../config';
import Button from '../../components/Button/Button';
import '../Login/Login.css';

const ROLE_OPTIONS: { value: GameRole; label: string }[] = [
    { value: 'map', label: 'Карта' },
    { value: 'mushroomsArmy', label: 'Армия грибов' },
    { value: 'mushroomsEconomy', label: 'Экономика грибов' },
    { value: 'peopleArmy', label: 'Армия людей' },
    { value: 'peopleEconomy', label: 'Экономика людей' },
];

interface RoleSelectProps {
    onSelectRole: (role: GameRole) => void;
}

const RoleSelect: React.FC<RoleSelectProps> = ({ onSelectRole }) => {
    const [role, setRole] = useState<GameRole | ''>('');

    const handleContinue = () => {
        if (role === '') return;
        onSelectRole(role);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Сервер</h2>

                <div className="login-form">
                    <div role="radiogroup" aria-label="Роль" className="role-radio-list">
                        {ROLE_OPTIONS.map(({ value, label }) => (
                            <label key={value} className="role-radio-row">
                                <input
                                    type="radio"
                                    name="game-role"
                                    value={value}
                                    checked={role === value}
                                    onChange={() => setRole(value)}
                                />
                                <span>{label}</span>
                                <span className="role-radio-host">{CONFIG.HOST_BY_ROLE[value]}</span>
                            </label>
                        ))}
                    </div>

                    <Button
                        onClick={handleContinue}
                        text="Далее"
                        variant="primary"
                        isDisabled={role === ''}
                        className="login-btn"
                    />
                </div>
            </div>
        </div>
    );
};

export default RoleSelect;
