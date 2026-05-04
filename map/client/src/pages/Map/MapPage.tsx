import React, { useEffect, useContext  } from 'react';
import { MediatorContext , ServerContext} from '../../App';
import MapCanvas from './MapCanvas/MapCanvas';
import './MapPage.scss';


const MapPage: React.FC = () => {

    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);

    useEffect(() => {
        console.log("НИЧАГО НЕ РАБОТАЕТ, НА ПЕРЕПИСЫВАНИИ");
    });

    return (
        <div className='map'>
            <div className="canvas-container">
                <MapCanvas />
                <p>Карта</p>
            </div>
        </div>
    );
};

export default MapPage;