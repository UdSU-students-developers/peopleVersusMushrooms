import React, { useContext, useEffect, useState } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage, PAGES } from '../PageManager';
import Button from "../../components/Button/Button";
import { TError } from "../../services/server/types";
import './Lobby.scss';

const Lobby: React.FC<IBasePage> = (props) => {
    const { setPage } = props;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const [error, setError] = useState<TError | null>(null);

    const logoutClickHandler = async () => {
        server.logout();
    }

    useEffect(() => {
        const { LOGOUT } = mediator.getEventTypes();
        const { SHOW_ERROR } = mediator.getEventTypes();

        const logoutHandler = () => {
            setError(null);
            setPage(PAGES.LOGIN);
        };

        const serverErrorHandler = (error: TError) => {
            setError(error);
        };

        mediator.subscribe(LOGOUT, logoutHandler);
        mediator.subscribe(SHOW_ERROR, serverErrorHandler);

        return () => {
            mediator.unsubscribe(LOGOUT, logoutHandler);
            mediator.unsubscribe(SHOW_ERROR, serverErrorHandler);
        };
    });

    return (<div className='lobby'>
        <Button
            onClick={logoutClickHandler}
            text='выйти'
            className='button-logout'
            id='test-button-logout'
        />
        {error && <p id='test-errors-login' className='errors'>{error.message}</p>}

    </div>)
}

export default Lobby;