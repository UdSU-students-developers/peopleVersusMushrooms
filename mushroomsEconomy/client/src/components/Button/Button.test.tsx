import { render, screen, fireEvent } from '@testing-library/react';
import Button, { TButton } from './Button';

describe('Button Component', () => {
    // Базовый рендер
    test('кнопка рендерится с текстом', () => {
        render(<Button text="Нажми меня" onClick={() => {}} />);
        expect(screen.getByText('Нажми меня')).toBeInTheDocument();
    });

    test('кнопка рендерится с дочерними элементами вместо text', () => {
        render(
            <Button onClick={() => {}}>
                <span>Дочерний элемент</span>
            </Button>
        );
        expect(screen.getByText('Дочерний элемент')).toBeInTheDocument();
    });

    test('кнопка рендерится с text и children одновременно', () => {
        render(
            <Button text="Основной текст" onClick={() => {}}>
                <span>Дополнительный текст</span>
            </Button>
        );
        expect(screen.getByText('Основной текст')).toBeInTheDocument();
        expect(screen.getByText('Дополнительный текст')).toBeInTheDocument();
    });

    test('применяется правильный класс для варианта main по умолчанию', () => {
        render(<Button text="Кнопка" onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).toHaveClass('button-main');
    });

    test('применяется правильный класс для разных вариантов', () => {
        const variants = ['main', 'secondary', 'danger', 'success'];
        
        variants.forEach(variant => {
            const { unmount } = render(<Button text={variant} variant={variant} onClick={() => {}} />);
            const button = screen.getByText(variant);
            expect(button).toHaveClass(`button-${variant}`);
            unmount();
        });
    });

    test('применяется пользовательский className', () => {
        render(<Button text="Кнопка" className="my-custom-class" onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).toHaveClass('my-custom-class');
        expect(button).toHaveClass('button');
        expect(button).toHaveClass('button-main');
    });

    //роверка состояния hover
    test('применяется класс hover когда isHover=true', () => {
        render(<Button text="Кнопка" isHover={true} onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).toHaveClass('hover');
    });

    test('не применяется класс hover когда isHover=false', () => {
        render(<Button text="Кнопка" isHover={false} onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).not.toHaveClass('hover');
    });

    //Проверка состояния disabled
    test('кнопка disabled когда isDisabled=true', () => {
        render(<Button text="Кнопка" isDisabled={true} onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled');
        expect(button).toHaveAttribute('disabled');
    });

    test('кнопка активна когда isDisabled=false', () => {
        render(<Button text="Кнопка" isDisabled={false} onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).not.toBeDisabled();
        expect(button).not.toHaveClass('disabled');
    });

    test('кнопка активна по умолчанию когда isDisabled не передан', () => {
        render(<Button text="Кнопка" onClick={() => {}} />);
        const button = screen.getByText('Кнопка');
        expect(button).not.toBeDisabled();
    });

    //Проверка onClick
    test('onClick вызывается при клике на активную кнопку', () => {
        const mockOnClick = jest.fn();
        render(<Button text="Кнопка" onClick={mockOnClick} />);
        
        const button = screen.getByText('Кнопка');
        fireEvent.click(button);
        
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('onClick НЕ вызывается при клике на disabled кнопку', () => {
        const mockOnClick = jest.fn();
        render(<Button text="Кнопка" isDisabled={true} onClick={mockOnClick} />);
        
        const button = screen.getByText('Кнопка');
        fireEvent.click(button);
        
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('onClick вызывается с правильными аргументами', () => {
        const mockOnClick = jest.fn();
        const testEvent = { target: { value: 'test' } };
        
        render(<Button text="Кнопка" onClick={mockOnClick} />);
        const button = screen.getByText('Кнопка');
        fireEvent.click(button, testEvent);
        
        expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
    });

    //Проверка id и title
    test('применяется переданный id', () => {
        const testId = 'test-button-id';
        render(<Button text="Кнопка" id={testId} onClick={() => {}} />);
        
        const button = screen.getByText('Кнопка');
        expect(button).toHaveAttribute('id', testId);
    });

    test('применяется переданный title', () => {
        const testTitle = 'Тестовая подсказка';
        render(<Button text="Кнопка" title={testTitle} onClick={() => {}} />);
        
        const button = screen.getByText('Кнопка');
        expect(button).toHaveAttribute('title', testTitle);
    });

    test('id и title опциональны и могут отсутствовать', () => {
        render(<Button text="Кнопка" onClick={() => {}} />);
        
        const button = screen.getByText('Кнопка');
        expect(button).not.toHaveAttribute('id');
        expect(button).not.toHaveAttribute('title');
    });

    test('применяются все классы одновременно', () => {
        render(
            <Button 
                text="Кнопка" 
                variant="danger" 
                className="custom"
                isHover={true}
                isDisabled={true}
                onClick={() => {}}
            />
        );
        
        const button = screen.getByText('Кнопка');
        expect(button).toHaveClass('button');
        expect(button).toHaveClass('button-danger');
        expect(button).toHaveClass('custom');
        expect(button).toHaveClass('hover');
        expect(button).toHaveClass('disabled');
    });

    //Snapshot тест
    test('соответствует снимку для разных состояний', () => {
        const { container: defaultButton } = render(<Button text="Обычная" onClick={() => {}} />);
        expect(defaultButton).toMatchSnapshot();
        
        const { container: disabledButton } = render(<Button text="Отключена" isDisabled={true} onClick={() => {}} />);
        expect(disabledButton).toMatchSnapshot();
        
        const { container: hoverButton } = render(<Button text="Наведение" isHover={true} onClick={() => {}} />);
        expect(hoverButton).toMatchSnapshot();
    });
});