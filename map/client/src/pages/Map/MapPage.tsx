import React, { useContext } from 'react';
import { MediatorContext } from '../../App';
import { IBasePage, IPageManager } from '../PageManager';
import MapCanvas from './MapCanvas/MapCanvas';
import './MapPage.scss';


const MapPage: React.FC<IBasePage & IPageManager> = (props) => {
    const { server } = props;
    const mediator = useContext(MediatorContext);


    return (
        <div className='map'>
            <div className="canvas-container">
                <MapCanvas
                    mediator={mediator}
                    server={server} />
                <p>Карта</p>
            </div>
        </div>
    );
};

export default MapPage;